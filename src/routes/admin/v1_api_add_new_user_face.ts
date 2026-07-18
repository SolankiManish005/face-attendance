import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { accounts, faces } from "@/database/schema";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { fileRequestSchemaWithLimit } from "@/pkg/common/common-schemas";
import { createRouteConfig } from "@/pkg/common/route-config";
import { ApiError } from "@/pkg/errors/http";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase, getCtxFaceApi } from "@/pkg/lib/context";
import { storage } from "@/pkg/storage/storage";
import { handleFileDestStorage } from "@/pkg/utils/file";
import { typeIdValidator } from "@/pkg/utils/typeid";
import type { FaceApiDescriptor } from "@/services/faceApi";
import { z } from "@hono/zod-openapi";
import type { BaseMime } from "hono/utils/mime";

const addNewUserFaceRequestSchema = z.object({
  file: fileRequestSchemaWithLimit(1, [
    "image/jpeg",
    "image/png",
    "image/webp",
  ] satisfies BaseMime[]),
  accountPublicId: typeIdValidator("account"),
});

const addNewUserFace200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["admin"],
  summary: "Add new user face",
  method: "post",
  path: "/v1/admin.addNewUserFace",
  guard: isAuthenticated(),
  operationId: "addNewUserFace",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: addNewUserFaceRequestSchema,
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
          schema: successWithDataSchema(addNewUserFace200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiAddNewUserFace = (app: App) => {
  app.openapi(route, async (c) => {
    const db = getCtxDatabase();
    const faceApi = getCtxFaceApi();
    const form = c.req.valid("form");

    const userDetail = await db.query.accounts.findFirst({
      where: (fields, operators) => {
        return operators.and(operators.eq(fields.publicId, form.accountPublicId));
      },
    });

    const renamedFiles: File = new File(
      [form.file],
      `${userDetail!.firstName}_${userDetail!.publicId}-${randomUUID()}-${form.file.name.trim()}`,
      {
        type: form.file.type,
        lastModified: form.file.lastModified,
      },
    );

    await handleFileDestStorage("./uploads/faces", renamedFiles);
    const dist = join("./uploads/faces", renamedFiles.name);
    const fd = await faceApi.transformToDescriptor(dist);

    if (!fd) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Face not detected",
      });
    }

    const insertedUser = await db.transaction(async (trx) => {
      const [insertedFace] = await trx
        .insert(faces)
        .values({
          accountPublicId: userDetail!.publicId,
          faceImage: renamedFiles.name,
          descriptorString: fd.toString(),
        })
        .returning();

      return insertedFace;
    });

    if (!insertedUser) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Failed to insert face descriptor",
      });
    }

    const existingDescriptorString = await storage.faceApiDescriptors.getItemRaw(
      userDetail!.publicId,
    );
    let mergedDescriptors: FaceApiDescriptor[] = [];

    if (existingDescriptorString) {
      mergedDescriptors = [...existingDescriptorString.descriptors, fd]; // Merge old + new
    } else {
      mergedDescriptors = [fd]; // No old descriptors, use only the new one
    }
    const lfd = faceApi.labelFaceDescriptors(userDetail!.publicId, mergedDescriptors);

    await storage.faceApiDescriptors.setItemRaw(userDetail!.publicId, lfd);

    await db.transaction(async (trx) => {
      await trx
        .update(accounts)
        .set({
          labelFaceDescriptorsString: faceApi.labelFaceDescriptorsToString(lfd),
        })
        .returning();
    });
    return c.json({ success: true, data: {} }, 200);
  });
};
