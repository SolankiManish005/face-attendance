import { accounts } from "@/database/schema";
import { isPublicAccess } from "@/middleware/guard";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { createRouteConfig } from "@/pkg/common/route-config";
import { errorResponse } from "@/pkg/errors/http";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase } from "@/pkg/lib/context";
import { createLuciaSessionCookie } from "@/pkg/utils/session";
import { typeIdGenerator } from "@/pkg/utils/typeid";
import { z } from "@hono/zod-openapi";
import { Argon2id } from "oslo/password";

const adminSignInWithEmailAndPasswordRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const adminSignInWithEmailAndPassword200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["auth"],
  summary: "Admin sign in with email and password",
  method: "post",
  path: "/v1/auth.adminSignInWithEmailAndPassword",
  guard: isPublicAccess,
  operationId: "adminSignInWithEmailAndPassword",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: adminSignInWithEmailAndPasswordRequestSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "",
      content: {
        "application/json": {
          schema: successWithDataSchema(adminSignInWithEmailAndPassword200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiAdminSignInWithEmailAndPassword = (app: App) => {
  app.openapi(route, async (c) => {
    const db = getCtxDatabase();

    // 🔐 Ensure admin@admin.com exists
    const existingAdmin = await db.query.accounts.findFirst({
      where: (t, { eq }) => eq(t.email, "admin@admin.com"),
    });

    if (!existingAdmin) {
      const passwordHash = await new Argon2id().hash("admin@123456");

      await db.insert(accounts).values({
        publicId: typeIdGenerator("account"),
        email: "admin@admin.com",
        firstName: "Admin",
        lastName: "Admin",
        role: "admin",
        passwordHash,
        mobile: "0000000000", // 👈 required in schema, so use dummy value if needed
        dob: "1990-01-01", // 👈 required, must be string (format: YYYY-MM-DD)
        bloodGroup: "O+", // 👈 required, must match enum
        department: "Admin",
        designation: "Super Admin", // 👈 required in schema
        emailVerified: true,
        labelFaceDescriptorsString: "{}", // default
      });
    }

    const { email, password } = c.req.valid("json");

    const admin = await db.query.accounts.findFirst({
      columns: {
        id: true,
        publicId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        mobile: true,
        dob: true,
        bloodGroup: true,
        department: true,
        passwordHash: true,
      },
      where: (t, { eq, and }) => and(eq(t.email, email), eq(t.role, "admin")),
    });

    if (!admin || !(await new Argon2id().verify(admin.passwordHash, password))) {
      return errorResponse(c, "UNAUTHORIZED", "Invalid email or password");
    }

    const sessionCookie = await createLuciaSessionCookie(c, {
      accountId: admin.id,
      publicId: admin.publicId,
      role: admin.role,
    });

    return c.json(
      {
        success: true,
        data: {
          u: { ...admin, passwordHash: undefined },
          accessToken: sessionCookie.value,
        },
      },
      200,
    );
  });
};
