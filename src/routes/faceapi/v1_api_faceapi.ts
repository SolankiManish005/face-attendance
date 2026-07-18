import { isPublicAccess } from "@/middleware/guard";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { createRouteConfig } from "@/pkg/common/route-config";
import type { App } from "@/pkg/hono/app";
import { z } from "@hono/zod-openapi";

const faceapiRequestSchema = z.object({});

const faceapi200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["unknown"],
  summary: "todo",
  method: "post",
  path: "/v1/faceapi.faceapi",
  guard: isPublicAccess,
  operationId: "faceapi",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: faceapiRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "",
      content: {
        "application/json": {
          schema: successWithDataSchema(faceapi200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiFaceapi = (app: App) => {
  app.openapi(route, async (c) => {
    return c.json({ success: true, data: {} }, 200);
  });
};
