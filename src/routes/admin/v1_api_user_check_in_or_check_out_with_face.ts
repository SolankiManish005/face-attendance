import { hasAdminAccess } from "@/middleware/guard/authz";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import { errorResponses, successWithDataSchema } from "@/pkg/common/common-responses";
import { fileRequestSchema } from "@/pkg/common/common-schemas";
import { createRouteConfig } from "@/pkg/common/route-config";
import { ApiError, errorResponse } from "@/pkg/errors/http";
import type { App } from "@/pkg/hono/app";
import { getCtxDatabase, getCtxDatabaseService, getCtxFaceApi } from "@/pkg/lib/context";
import { logger } from "@/pkg/logger/logger";
import { fetchCompanyFaceApiLabeledDescriptors } from "@/pkg/storage/face-api";
import { DatabaseService } from "@/services/database";
import { z } from "@hono/zod-openapi";
import { endOfDay, startOfDay } from "date-fns";

const userCheckInOrCheckOutWithFaceRequestSchema = z.object({
  file: fileRequestSchema,
  companyId: z.string().min(1),
});

const userCheckInOrCheckOutWithFace200ResponseSchema = z.object({});

const route = createRouteConfig({
  tags: ["admin"],
  summary: "User check in or check out",
  description: "User check in or check out with face",
  method: "post",
  path: "/v1/admin.userCheckInOrCheckOutWithFace",
  guard: [isAuthenticated(), hasAdminAccess],
  operationId: "userCheckInOrCheckOutWithFace",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: userCheckInOrCheckOutWithFaceRequestSchema,
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
          schema: successWithDataSchema(userCheckInOrCheckOutWithFace200ResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const registerV1ApiUserCheckInOrCheckOutWithFace = (app: App) => {
  app.openapi(route, async (c) => {
    const dbService = getCtxDatabaseService();
    const db = getCtxDatabase();
    const faceApi = getCtxFaceApi();

    const form = c.req.valid("form");
    if (Array.isArray(form.file)) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "Multiple images is not provided",
      });
    }

    const companyId = form.companyId;

    const requestFaceDescriptor = await faceApi.transformToDescriptor(form.file);

    if (!requestFaceDescriptor) {
      return errorResponse(c, "BAD_REQUEST", "No face detected in the image");
    }

    const companyFaceDescriptors = await fetchCompanyFaceApiLabeledDescriptors(companyId);

    if (!companyFaceDescriptors || companyFaceDescriptors.length === 0) {
      return errorResponse(c, "BAD_REQUEST", "No registered faces found for this company");
    }

    const faceMatch = faceApi.match({
      faceDescriptors: requestFaceDescriptor.descriptor,
      labeledDescriptors: companyFaceDescriptors,
      distanceThreshold: 0.5,
    });

    logger.info(`Face match ${faceMatch?.distance}`);

    if (faceMatch.label === "unknown" || faceMatch.distance > 0.6) {
      return c.json({ success: true, data: { matched: false } as const }, 200);
    }

    // Extract actual publicId from company-specific label
    logger.info(`Face match label: ${faceMatch.label}`);
    const actualPublicId = faceMatch.label.includes("_")
      ? faceMatch.label.split("_").slice(0, -1).join("_")
      : faceMatch.label;
    logger.info(`Extracted publicId: ${actualPublicId}`);

    const [userLastCheckIn, userDetails] = await Promise.all([
      dbService.getAccountLastCheckInWithoutCheckOutForDate(actualPublicId, new Date()),
      dbService.getAccountDetailsByPublicId(actualPublicId, companyId),
    ]);

    if (!userDetails) {
      return c.json(
        {
          success: true,
          data: {
            matched: false,
            reason: "User not registered with this company",
            faceMatch: {
              label: actualPublicId,
              distance: faceMatch.distance,
            },
          },
        },
        200,
      );
    }

    if (!userLastCheckIn) {
      await dbService.addAttendanceCheckIn(userDetails.publicId, new Date(), companyId);
    } else {
      if (userLastCheckIn.hasPreviousDayCheckInWithoutCheckOut) {
        // add previous day check out at the day end (23:59:59) and add check in for current day
        const endOfPreviousDay = endOfDay(userLastCheckIn.checkIn);
        const startOfCurrentDay = startOfDay(new Date());
        await db.transaction(async (trx) => {
          const transactionDbService = DatabaseService.serviceWithTransaction(trx);

          // add previous day check out at the day end (23:59:59)
          await transactionDbService.addAttendanceCheckOutById(
            userLastCheckIn.id,
            endOfPreviousDay,
          );
          // add check in for current start of the day
          const insertedCheckIn = await transactionDbService.addAttendanceCheckIn(
            userDetails.publicId,
            startOfCurrentDay,
            companyId,
          );
          // add check out for current day
          await transactionDbService.addAttendanceCheckOutById(
            insertedCheckIn?.id || 0,
            new Date(),
          );
        });
      } else {
        await dbService.addAttendanceCheckOutById(userLastCheckIn.id, new Date());
      }
    }

    return c.json(
      {
        success: true,
        data: {
          matched: true,
          userDetails,
          isCheckIn: !userLastCheckIn,
          companyId,
          faceMatch: {
            label: actualPublicId,
            distance: faceMatch.distance,
          },
        },
      },
      200,
    );
  });
};
