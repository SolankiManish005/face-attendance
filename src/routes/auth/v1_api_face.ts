import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { createRouteConfig } from "@/pkg/common/route-config";
import type { App } from "@/pkg/hono/app";
import { z } from "@hono/zod-openapi";

const faceRequestSchema = z.object({});

const face200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["unknown"],
  summary: "todo",
  method: "post",
  path: "/v1/auth.face",
  guard: isAuthenticated(),
  operationId: "face",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: faceRequestSchema,
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
          schema: successWithDataSchema(face200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiFace = (app: App) => {
  app.openapi(route, async (c) => {
    return c.json({ success: true, data: {} }, 200);
  });
};
