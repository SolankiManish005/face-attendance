import { schema } from "@/database";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import {
  errorResponses,
  successWithDataSchema,
  withPaginationSchema,
} from "@/pkg/common/common-responses";
import { paginationQuerySchema } from "@/pkg/common/common-schemas";
import { createRouteConfig } from "@/pkg/common/route-config";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase } from "@/pkg/lib/context";
import { getOrderColumn } from "@/pkg/utils/drizzle";
import { typeIdValidator } from "@/pkg/utils/typeid";
import { z } from "@hono/zod-openapi";
import { and, count, eq, sql } from "drizzle-orm";

const listLatestAttendanceForUserByPublicIdQuerySchema = paginationQuerySchema.extend({
  publicId: typeIdValidator("account"),
});

const listLatestAttendanceForUserByPublicId200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["admin"],
  summary: "List latest attendance for user by id",
  description: "List latest attendance for user by public id",
  method: "get",
  path: "/v1/admin.listLatestAttendanceForUserByPublicId",
  guard: isAuthenticated(),
  operationId: "listLatestAttendanceForUserByPublicId",
  request: {
    query: listLatestAttendanceForUserByPublicIdQuerySchema,
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "",
      content: {
        "application/json": {
          schema: successWithDataSchema(
            withPaginationSchema(listLatestAttendanceForUserByPublicId200ResponseSchema),
          ),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiListLatestAttendanceForUserByPublicId = (app: App) => {
  app.openapi(route, async (c) => {
    const db = getCtxDatabase();

    const { limit, offset, order, sort, publicId } = c.req.valid("query");

    const orderColumn = getOrderColumn(
      {
        createdAt: schema.attendance.createdAt,
      },
      sort,
      schema.attendance.createdAt,
      order,
    );

    const firstFace = db.$with("firstFace").as(
      db
        .select({
          faceId: schema.faces.id,
          accountId: schema.faces.accountPublicId,
          faceImage: schema.faces.faceImage,
          rowNum:
            sql<number>`ROW_NUMBER() OVER (PARTITION BY ${schema.faces.accountPublicId} ORDER BY ${schema.faces.id} ASC)`.as(
              "row_num",
            ),
        })
        .from(schema.faces)
        .where(eq(schema.faces.accountPublicId, publicId)),
    );

    const prepare = db
      .with(firstFace)
      .select({
        accountPublicId: schema.accounts.publicId,
        firstName: schema.accounts.firstName,
        lastName: schema.accounts.lastName,
        department: schema.accounts.department,
        bioId: schema.accounts.bioId,
        checkInDate: sql<Date>`${schema.attendance.checkIn}::date`,
        checkInTime: sql<string>`TO_CHAR(${schema.attendance.checkIn}, 'HH24:MI:SS')`,
        checkOutTime: sql<string>`TO_CHAR(${schema.attendance.checkOut}, 'HH24:MI:SS')`,
        duration: sql<string>`
          CASE 
        WHEN ${schema.attendance.checkOut} IS NOT NULL 
        THEN age(${schema.attendance.checkOut}, ${schema.attendance.checkIn})::text 
        ELSE 'In Progress'
END`,
        faceImage: firstFace.faceImage,
      })
      .from(schema.attendance)
      .innerJoin(schema.accounts, eq(schema.attendance.accountPublicId, schema.accounts.publicId))
      .leftJoin(
        firstFace,
        and(eq(schema.accounts.publicId, firstFace.accountId), eq(firstFace.rowNum, 1)),
      )
      .where(eq(schema.accounts.publicId, publicId))
      .orderBy(orderColumn);

    const [d] = await db.select({ total: count() }).from(prepare.as("t"));
    const result = await prepare.limit(limit).offset(offset);

    return c.json(
      {
        success: true,
        data: {
          total: d?.total ?? 0,
          items: result,
        },
      },
      200,
    );
  });
};
