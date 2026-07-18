import { isPublicAccess } from "@/middleware/guard";
import { errorResponses } from "@/pkg/common/common-responses";
import { createRouteConfig } from "@/pkg/common/route-config";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase } from "@/pkg/lib/context";
import { z } from "@hono/zod-openapi";
import { parse } from "date-fns";
import { sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { stream } from "hono/streaming";

const getAttendanceExcelSheetRequestSchema = z.object({});

export const dateSchema = z
  .string()
  .transform<Date>((value) => z.date().parse(parse(value, "yyyy-MM-dd", new Date())))
  .openapi({
    description: "ISO date string",
  });

const route = createRouteConfig({
  tags: ["admin"],
  summary: "Get Attendance Excel Sheet",
  method: "get",
  path: "/v1/admin.getAttendanceExcelSheet",
  // guard: [isAuthenticated(), hasAdminAccess],
  guard: isPublicAccess,
  operationId: "getAttendanceExcelSheet",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: getAttendanceExcelSheetRequestSchema,
        },
      },
    },
    query: z.object({
      from: dateSchema,
      to: dateSchema,
      email: z.string().optional(),
    }),
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: z.any(),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiGetAttendanceExcelSheet = (app: App) => {
  app.openapi(route, async (c) => {
    const db = getCtxDatabase();
    const { from, to, email } = c.req.valid("query");

    const attendance = await db.query.attendance.findMany({
      columns: {
        accountPublicId: true,
        checkIn: true,
        checkOut: true,
      },
      with: {
        account: {
          columns: {
            email: true,
          },
        },
      },
      where(fields, o) {
        return o.and(
          o.gte(fields.checkIn, from),
          o.lte(fields.checkIn, to),
          email ? sql`"attendance_account"."data"->>0=${email}` : sql`true`,
        );
      },
    });

    // * Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    worksheet.columns = [
      { header: "Email", key: "email" },
      {
        header: "Clock In Time",
        key: "clockInTime",
        style: { numFmt: "yyyy-mm-dd hh:mm:ss" }, // Excel date format
      },
      {
        header: "Clock Out Time",
        key: "clockOutTime",
        style: { numFmt: "yyyy-mm-dd hh:mm:ss" },
      },
      { header: "Clock In Ip", key: "clockInIp" },
      { header: "Clock Out Ip", key: "clockOutIp" },
      { header: "Working From", key: "workingFrom" },
      { header: "Late", key: "late" },
      { header: "Half Day", key: "halfDay" },
    ];

    worksheet.addRows(
      attendance.map((att) => ({
        email: att.account.email,
        clockInTime: att.checkIn,
        clockOutTime: att.checkOut,
        clockInIp: "127.0.0.1",
        clockOutIp: "127.0.0.1",
        workingFrom: "office",
        late: "no",
        halfDay: "no",
      })),
    );

    const response = stream(c, async (strm) => {
      await workbook.xlsx.write(strm as any);
    });

    response.headers.append(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    response.headers.append("Content-Disposition", "attachment; filename=attendance.xlsx");

    return response;
  });
};
