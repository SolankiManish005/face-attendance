import { db } from "@/database";
import type { HonoEnv } from "@/pkg/hono/env";
import { logger } from "@/pkg/logger/logger";
import { DatabaseService } from "@/services/database";
import { faceApi } from "@/services/faceApi";
import type { MiddlewareHandler } from "hono";

export function init(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const requestId = c.get("requestId");
    c.set("logger", logger.child({ requestId }));

    const databaseService = new DatabaseService(db);
    // * Set the services context
    c.set("services", {
      faceApi: faceApi,
      db: db,
      databaseService: databaseService,
    });

    await next();
  };
}
