import { hasAdminAccess } from "@/middleware/guard/authz";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import {
  errorResponses,
  successWithDataSchema,
  withOutPaginationSchema,
} from "@/pkg/common/common-responses";
import { createRouteConfig } from "@/pkg/common/route-config";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase } from "@/pkg/lib/context";
import { z } from "@hono/zod-openapi";

const listAllUserAccount200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["admin"],
  summary: "List all user account",
  description: "List all user account with face images",
  method: "get",
  path: "/v1/admin.listAllUserAccount",
  guard: [isAuthenticated(), hasAdminAccess],
  operationId: "listAllUserAccount",
  request: {
    query: z.object({
      companyId: z.string().optional().openapi({ example: "COMP001" }),
    }),
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "",
      content: {
        "application/json": {
          schema: successWithDataSchema(
            withOutPaginationSchema(listAllUserAccount200ResponseSchema),
          ),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiListAllUserAccount = (app: App) => {
  app.openapi(route, async (c) => {
    const db = getCtxDatabase();
    const { companyId } = c.req.valid("query");

    const userDetails = await db.query.accounts.findMany({
      columns: {
        bloodGroup: true,
        createdAt: true,
        department: true,
        designation: true,
        dob: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        publicId: true,
        companyId: true,
      },
      where: (t, o) => {
        const conditions = [o.eq(t.role, "user")];
        if (companyId) {
          conditions.push(o.eq(t.companyId, companyId));
        }
        return o.and(...conditions);
      },
      with: {
        faces: {
          columns: {
            id: true,
            faceImage: true,
          },
        },
      },
    });

    return c.json({ success: true, data: { items: userDetails } }, 200);
  });
};
