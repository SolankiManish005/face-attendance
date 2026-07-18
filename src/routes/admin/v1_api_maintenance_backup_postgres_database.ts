import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { hasAdminAccess } from "@/middleware/guard/authz";
import { isAuthenticated } from "@/middleware/guard/is-authenticated";
import { errorResponses } from "@/pkg/common/common-responses";
import { createRouteConfig } from "@/pkg/common/route-config";
import { appEnv } from "@/pkg/env/env";
import type { App } from "@/pkg/hono/app";
import { logger } from "@/pkg/logger/logger";
import { parsePostgresUri } from "@/pkg/utils/postgres";
import { FormatEnum, pgDump } from "pg-dump-restore";
// import { z } from "@hono/zod-openapi";

const route = createRouteConfig({
  tags: ["admin"],
  summary: "Maintenance backup postgres database",
  method: "post",
  path: "/v1/admin.maintenance.backupPostgresDatabase",
  guard: [isAuthenticated(), hasAdminAccess],
  operationId: "maintenanceBackupPostgresDatabase",
  request: {},
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "",
    },
    ...errorResponses,
  },
});

export const registerV1ApiMaintenanceBackupPostgresDatabase = (app: App) => {
  app.openapi(route, async (c) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const postgresqlCredentials = parsePostgresUri(appEnv.PG_DATABASE_URL);
    const filePath = `./internal/database/backup-${timestamp}.sql`;
    const { stdout, stderr } = await pgDump(postgresqlCredentials, {
      filePath: filePath,
      format: FormatEnum.Plain,
    });

    if (stderr) {
      throw new Error(stderr);
    }

    logger.info(`Backup postgres database to ${filePath}`, stdout);

    const stream = Readable.toWeb(createReadStream(filePath));
    return c.body(stream, 200);
  });
};
