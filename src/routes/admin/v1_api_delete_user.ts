import { rm } from "node:fs/promises";
import { join } from "node:path";
import { accounts, attendance, faces, leaves, sessions } from "@/database/schema";
import { hasAdminAccess } from "@/middleware/guard/authz";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { createRouteConfig } from "@/pkg/common/route-config";
import { errorResponse } from "@/pkg/errors/http";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase } from "@/pkg/lib/context";
import { type TypeId, typeIdValidator } from "@/pkg/utils/typeid";
import { z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

const deleteUserRequestSchema = z.object({
  publicId: typeIdValidator("account").openapi({ example: "acc_01jz7z6pz6en9a99vy2h2s4bpm" }),
});

const deleteUser200ResponseSchema = z.object({
  deletedUser: z.object({
    email: z.string(),
    firstName: z.string(),
  }),
  deletedFiles: z.array(z.string()),
  failedFiles: z.array(z.string()),
});

const route = createRouteConfig({
  tags: ["admin"],
  summary: "Delete user account",
  description: "Hard delete user account and all related data by publicId",
  method: "delete",
  path: "/v1/admin.deleteUser",
  guard: [isAuthenticated(), hasAdminAccess],
  operationId: "deleteUser",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: deleteUserRequestSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User deleted successfully",
      content: {
        "application/json": {
          schema: successWithDataSchema(deleteUser200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

/**
 * Delete user account with hard delete approach
 * Removes user and all related data from all tables
 * @author Brijesh Sagathiya
 */
export const registerV1ApiDeleteUser = (app: App) => {
  app.openapi(route, async (c) => {
    const db = getCtxDatabase();
    const { publicId }: { publicId: TypeId<"account"> } = c.req.valid("json");

    const user = await db.query.accounts.findFirst({
      columns: { publicId: true, firstName: true, email: true },
      where: eq(accounts.publicId, publicId),
      with: {
        faces: { columns: { faceImage: true } },
      },
    });

    if (!user) {
      return errorResponse(c, "NOT_FOUND", `User with publicId ${publicId} not found`);
    }

    await db.transaction(async (trx) => {
      await trx.delete(attendance).where(eq(attendance.accountPublicId, user.publicId));
      await trx.delete(leaves).where(eq(leaves.accountPublicId, user.publicId));
      await trx.delete(sessions).where(eq(sessions.accountPublicId, user.publicId));
      await trx.delete(faces).where(eq(faces.accountPublicId, user.publicId));
      await trx.delete(accounts).where(eq(accounts.publicId, publicId));
    });

    const deletedFiles: string[] = [];
    const failedFiles: string[] = [];

    for (const face of user.faces) {
      try {
        await rm(join("./uploads/faces", face.faceImage));
        deletedFiles.push(face.faceImage);
      } catch {
        failedFiles.push(face.faceImage);
      }
    }

    return c.json(
      {
        success: true,
        data: {
          deletedUser: {
            email: user.email,
            firstName: user.firstName,
          },
          deletedFiles,
          failedFiles,
        },
      },
      200,
    );
  });
};
