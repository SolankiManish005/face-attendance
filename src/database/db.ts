import { appEnv } from "@/pkg/env/env";
import { logger } from "@/pkg/logger/logger";
import { DrizzleLogger } from "@/pkg/logger/sql";
import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let sql: postgres.Sql | undefined;

export async function createConnection(): Promise<Database> {
  sql = postgres(appEnv.PG_DATABASE_URL, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    connection: { TimeZone: "Asia/Kolkata" },
  });

  await checkDbConnection(sql);

  return drizzle(sql, {
    schema,
    logger: appEnv.NODE_ENV === "development" ? new DrizzleLogger() : false,
  });
}

export async function checkDbConnection(client: postgres.Sql): Promise<void> {
  const res = await client`SELECT NOW()`.catch((err) => {
    logger.error("Failed to connect to database");
    throw new Error("Failed to connect to database", { cause: err });
  });
  logger.info("Connected to database", { dbTime: res[0].now });
}
