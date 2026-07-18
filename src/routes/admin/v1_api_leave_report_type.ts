import { leaves } from "@/database/schema";
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
import { and, eq, gte, lte } from "drizzle-orm";

const reportType = ["daily", "weekly", "monthly", "yearly"] as const;

const getLeavesByFilterQuerySchema = z.object({
  type: z.enum(reportType),
  date: z.string().openapi({ example: "2025-05-13" }),
  accountPublicId: z.string().openapi({ example: "acc_01hxxxxxx" }), // ✅ Add this
});

const getLeavesByFilter200ResponseSchema = z.object({
  id: z.number(),
  leaveDate: z.string(),
  reason: z.string().optional(),
  accountId: z.string(),
  status: z.string().optional(),
});

const route = createRouteConfig({
  tags: ["admin"],
  summary: "Get leave records by filter",
  description: "Fetch leave data filtered by daily, weekly, monthly, or yearly type",
  method: "get",
  path: "/v1/admin.getLeavesByFilter",
  guard: [isAuthenticated(), hasAdminAccess],
  operationId: "getLeavesByFilter",
  request: {
    query: getLeavesByFilterQuerySchema,
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "List of leaves for the selected period",
      content: {
        "application/json": {
          schema: successWithDataSchema(
            withOutPaginationSchema(getLeavesByFilter200ResponseSchema),
          ),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiGetLeavesByFilter = (app: App) => {
  app.openapi(route, async (c: any) => {
    const db = getCtxDatabase();
    const q = c.req.valid("query");

    const baseDate = new Date(q.date);
    let startDate: Date;
    let endDate: Date;

    switch (q.type) {
      case "daily": {
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "weekly": {
        const day = baseDate.getDay();
        const diffToMonday = baseDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(baseDate);
        startDate.setDate(diffToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "monthly": {
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        break;
      }
      case "yearly": {
        startDate = new Date(baseDate.getFullYear(), 0, 1);
        endDate = new Date(baseDate.getFullYear(), 11, 31);
        break;
      }
      default:
        return c.json({ success: false, message: "Invalid type" }, 400);
    }

    function toDateString(date: Date): any {
      return date.toISOString().split("T")[0];
    }

    const leaveData = await db
      .select()
      .from(leaves)
      .where(
        and(
          eq(leaves.accountPublicId, q.accountPublicId),
          gte(leaves.leaveDate, toDateString(startDate)),
          lte(leaves.leaveDate, toDateString(endDate)),
        ),
      );

    return c.json({ success: true, data: { items: leaveData } }, 200);
  });
};
