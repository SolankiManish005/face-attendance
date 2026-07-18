import { appEnv } from "@/pkg/env/env";
import { logger } from "@/pkg/logger/logger";
import chalk from "chalk";
import { highlight } from "cli-highlight";
import type { Logger } from "drizzle-orm";

export class DrizzleLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    // logger.info(
    //   chalk.cyanBright("DB Query: ") + highlight(query, { language: "sql", ignoreIllegals: true }),
    //   {
    //     params,
    //   },
    // );

    // Log the query and parameters
    if (appEnv.NODE_ENV === "development") {
      logger.debug(
        `${chalk.cyanBright("DB Query Escaped:")} ${highlight(
          this.replaceSqlPlaceholders(query, params),
          {
            language: "sql",
            ignoreIllegals: true,
          },
        )}`,
      );
    }
  }

  replaceSqlPlaceholders(sqlTemplate: string, values: any[]) {
    // Ensure the number of placeholders matches the number of values
    const placeholderCount = (sqlTemplate.match(/\$\d+/g) || []).length;
    if (placeholderCount !== values.length) {
      throw new Error(
        `Mismatch between placeholders (${placeholderCount}) and values (${values.length})`,
      );
    }

    // Replace placeholders with stringified values
    return sqlTemplate.replace(/\$(\d+)/g, (_match, index) => {
      const value = values[Number.parseInt(index) - 1];

      // Handle different types of values
      if (value === null || value === undefined) {
        return "NULL";
      }
      if (typeof value === "string") {
        // Escape single quotes and wrap in quotes
        return `'${value.replace(/'/g, "''")}'`;
      }
      if (typeof value === "number") {
        return value.toString();
      }
      if (typeof value === "boolean") {
        return value ? "true" : "false";
      }
      // For objects, arrays, etc., convert to JSON string
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    });
  }
}
