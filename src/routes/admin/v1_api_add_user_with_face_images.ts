import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { accounts, bloodGroupEnum, faces } from "@/database/schema";
import { hasAdminAccess } from "@/middleware/guard/authz";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { dateSchema, fileRequestSchema, mobileNumberSchema } from "@/pkg/common/common-schemas";
import { createRouteConfig } from "@/pkg/common/route-config";
import { ApiError, errorResponse } from "@/pkg/errors/http";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase, getCtxFaceApi } from "@/pkg/lib/context";
import { storage } from "@/pkg/storage/storage";
import { handleFileDestStorage } from "@/pkg/utils/file";
import { typeIdGenerator } from "@/pkg/utils/typeid";
import type { FaceApiDescriptor } from "@/services/faceApi";
import { z } from "@hono/zod-openapi";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { Argon2id } from "oslo/password";

const addUserWithFaceImagesRequestSchema = z.object({
  file: fileRequestSchema,
  firstName: z.string().min(1).openapi({ example: "John" }),
  lastName: z.string().min(1).openapi({ example: "Doe" }),
  email: z.string().email().nullable().openapi({ example: "example@example.com" }),
  mobile: mobileNumberSchema.nullable(),
  dob: dateSchema.nullable(),
  bloodGroup: z.enum(bloodGroupEnum).nullable().openapi({ example: "A+" }),
  designation: z.string().max(255).nullable().openapi({ example: "Software Engineer" }),
  department: z.string().max(255).openapi({ example: "Web Development" }),
  bioId: z.string().max(255).optional().openapi({ example: "BIO001" }),
  companyId: z.string().max(255).openapi({ example: "COMP001" }),
});

const addUserWithFaceImages200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["admin"],
  summary: "Add user with face images",
  method: "post",
  path: "/v1/admin.addUserWithFaceImages",
  guard: [isAuthenticated(), hasAdminAccess],
  operationId: "addUserWithFaceImages",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: addUserWithFaceImagesRequestSchema,
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
          schema: successWithDataSchema(addUserWithFaceImages200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiAddUserWithFaceImages = (app: App) => {
  app.openapi(route, async (c) => {
    const db = getCtxDatabase();
    const faceApi = getCtxFaceApi();
    const form = c.req.valid("form");

    if (!Array.isArray(form.file)) {
      return errorResponse(c, "BAD_REQUEST", "At least two images are required");
    }

    if (form.file.length < 2) {
      return errorResponse(c, "BAD_REQUEST", "At least two images are required");
    }

    // // Check if user already exists with this email in any company
    // const existingUserWithEmail = await db.query.accounts.findFirst({
    //   columns: { publicId: true, email: true, companyId: true, labelFaceDescriptorsString: true },
    //   where: (accounts, { eq }) => eq(accounts.email, form.email),
    // });

    let insertedUser;
    try {
      insertedUser = await db.transaction(async (trx) => {
        const [user] = await trx
          .insert(accounts)
          .values({
            publicId: typeIdGenerator("account"),
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email || null,
            mobile: form.mobile || null,
            dob: form.dob ? format(form.dob, "yyyy-MM-dd") : null,
            bloodGroup: form.bloodGroup || null,
            designation: form.designation || null,
            department: form.department,
            bioId: form.bioId || undefined,
            companyId: form.companyId,
            passwordHash: await new Argon2id().hash(randomUUID()),
            role: "user",
          } as any)
          .returning({
            id: accounts.id,
            publicId: accounts.publicId,
            role: accounts.role,
            firstName: accounts.firstName,
          });

        if (!user) {
          throw new ApiError({
            code: "BAD_REQUEST",
            message: "User not created",
          });
        }

        const renamedFiles: File[] = [];
        for (const [i, file] of (form.file as File[]).entries()) {
          renamedFiles.push(
            new File(
              [file],
              `${user!.firstName}_${user!.publicId}-${randomUUID()}-${i}-${file.name.trim()}`,
              {
                type: file.type,
                lastModified: file.lastModified,
              },
            ),
          );
        }

        const savePromise: Promise<void>[] = [];
        renamedFiles.forEach((file) => {
          savePromise.push(handleFileDestStorage("./uploads/faces", file));
        });

        await Promise.all(savePromise);

        const insertPromisesFn: (() => Promise<void>)[] = [];
        const faceApiDescriptors: FaceApiDescriptor[] = [];

        renamedFiles.forEach((file) => {
          insertPromisesFn.push(async () => {
            const dist = join("./uploads/faces", file.name);
            const fd = await faceApi.transformToDescriptor(dist);

            if (!fd) {
              throw new ApiError({
                code: "BAD_REQUEST",
                message: "Face not detected",
              });
            }

            faceApiDescriptors.push(fd);

            await trx.insert(faces).values({
              accountPublicId: user!.publicId,
              faceImage: file.name,
              descriptorString: fd.toString(),
              companyId: form.companyId,
            });
          });
        });

        await Promise.all(insertPromisesFn.map((fn) => fn()));

        const finalLfd = faceApi.labelFaceDescriptors(
          `${user!.publicId}_${form.companyId}`,
          faceApiDescriptors,
        );

        await storage.faceApiDescriptors.setItemRaw(
          `${user!.publicId}_${form.companyId}`,
          finalLfd,
        );

        await trx
          .update(accounts)
          .set({
            labelFaceDescriptorsString: faceApi.labelFaceDescriptorsToString(finalLfd),
          })
          .where(eq(accounts.publicId, user!.publicId));

        return user;
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        const constraintName = error?.constraint_name || error?.detail || "";
        let message = "User exists. Use another email or phone.";

        if (constraintName.includes("bio_id")) {
          message = "Bio ID already exists. Please use a different Bio ID.";
        }

        return c.json(
          {
            success: false,
            message,
            error: {
              code: "NOT_UNIQUE" as const,
              message,
            },
            requestId: c.get("requestId"),
          },
          400,
        );
      }
      throw error;
    }

    const userData = await db.query.accounts.findFirst({
      columns: {
        id: true,
        publicId: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        dob: true,
        bloodGroup: true,
        designation: true,
        department: true,
        bioId: true,
        companyId: true,
        role: true,
      },
      where: (t, { eq }) => eq(t.publicId, insertedUser!.publicId),
      with: {
        faces: {
          columns: {
            id: true,
            faceImage: true,
          },
        },
      },
    });

    return c.json(
      {
        success: true,
        data: {
          userData,
        },
      },
      200,
    );
  });
};
