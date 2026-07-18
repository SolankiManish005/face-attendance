import { hasAdminAccess } from "@/middleware/guard/authz";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { fileRequestSchema } from "@/pkg/common/common-schemas";
import { createRouteConfig } from "@/pkg/common/route-config";
import { errorResponse } from "@/pkg/errors/http";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase, getCtxFaceApi } from "@/pkg/lib/context";
import { fetchAllFaceApiLabeledDescriptors } from "@/pkg/storage/face-api";
import { z } from "@hono/zod-openapi";

const matchFaceAgainstAccountRequestSchema = z.object({
  file: fileRequestSchema,
});

const matchFaceAgainstAccount200ResponseSchema = z.discriminatedUnion("matched", [
  z.object({
    matched: z.literal(true),
    publicId: z.string().openapi({ example: "publicId" }),
    distance: z.number().openapi({ example: 0.5 }),
  }),
  z.object({
    matched: z.literal(false),
  }),
]);

const route = createRouteConfig({
  tags: ["admin"],
  summary: "Match face against account",
  method: "post",
  path: "/v1/admin.matchFaceAgainstAccount",
  guard: [isAuthenticated(), hasAdminAccess],
  operationId: "matchFaceAgainstAccount",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: matchFaceAgainstAccountRequestSchema,
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
          schema: successWithDataSchema(matchFaceAgainstAccount200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiMatchFaceAgainstAccount = (app: App) => {
  app.openapi(route, async (c) => {
    const db = getCtxDatabase();
    const faceApi = getCtxFaceApi();
    const form = c.req.valid("form");

    if (Array.isArray(form.file)) {
      return errorResponse(c, "BAD_REQUEST", "Only one image is required");
    }

    const requestFaceDescriptor = await faceApi.transformToDescriptor(form.file);

    if (!requestFaceDescriptor) {
      return errorResponse(c, "BAD_REQUEST", "No face detected in the image");
    }

    const allFaceDescriptors = await fetchAllFaceApiLabeledDescriptors();

    const faceMatch = faceApi.match({
      faceDescriptors: requestFaceDescriptor.descriptor,
      labeledDescriptors: allFaceDescriptors,
      distanceThreshold: 0.5,
    });

    if (faceMatch.label === "unknown" || faceMatch.distance > 0.6) {
      return c.json({ success: true, data: { matched: false } as const }, 200);
    }

    const userDetails = await db.query.accounts.findFirst({
      columns: {
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        publicId: true,
        dob: true,
      },
      where: (t, o) => {
        return o.eq(t.publicId, faceMatch.label as any);
      },
    });

    return c.json(
      {
        success: true,
        data: {
          matched: true,
          publicId: faceMatch.label,
          distance: faceMatch.distance,
          userDetails,
        } as const,
      },
      200,
    );
  });
};
