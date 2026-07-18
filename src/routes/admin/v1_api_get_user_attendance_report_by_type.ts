import { hasAdminAccess } from "@/middleware/guard/authz";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { createRouteConfig } from "@/pkg/common/route-config";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabaseService } from "@/pkg/lib/context";
import { typeIdValidator } from "@/pkg/utils/typeid";
import { z } from "@hono/zod-openapi";

export const reportType = ["monthly", "daily", "weekly"] as const;
const getUserAttendanceReportByTypeQuerySchema = z.object({
  reportType: z.enum(reportType),
  accountPublicId: typeIdValidator("account"),
});

const getUserAttendanceReportByType200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["admin"],
  summary: "Get user attendance report by type",
  description: "Get user attendance report by type (monthly, daily, weekly)",
  method: "get",
  path: "/v1/admin.getUserAttendanceReportByType",
  guard: [isAuthenticated(), hasAdminAccess],
  operationId: "getUserAttendanceReportByType",
  request: {
    query: getUserAttendanceReportByTypeQuerySchema,
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "",
      content: {
        "application/json": {
          schema: successWithDataSchema(getUserAttendanceReportByType200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiGetUserAttendanceReportByType = (app: App) => {
  app.openapi(route, async (c) => {
    const dbService = getCtxDatabaseService();

    const q = c.req.valid("query");
    let report: Array<any> = [];

    switch (q.reportType) {
      case "daily": {
        const dailyReport = await dbService.getAccountAttendanceDailyStatsByAccountPublicId(
          q.accountPublicId,
        );
        report = dailyReport;
        break;
      }
      case "weekly": {
        const weeklyReport = await dbService.getAccountAttendanceWeeklyStatsByAccountPublicId(
          q.accountPublicId,
        );
        report = weeklyReport;
        break;
      }
      case "monthly": {
        const monthlyReport = await dbService.getAccountAttendanceMonthlyStatsByAccountPublicId(
          q.accountPublicId,
        );
        report = monthlyReport;
        break;
      }
    }

    return c.json(
      {
        success: true,
        data: {
          type: q.reportType,
          report: report,
        },
      },
      200,
    );
  });
};
