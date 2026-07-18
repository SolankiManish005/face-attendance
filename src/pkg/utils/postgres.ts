import { logger } from "@/pkg/logger/logger";

/**
 * Parses a PostgreSQL URI and returns its components
 * @param {string} uri - PostgreSQL connection URI (e.g., "postgres://user:pass@host:5432/dbname")
 */
export function parsePostgresUri(uri: string) {
  try {
    // Remove leading postgres:// or postgresql:// if present
    const cleanUri = uri.replace(/^(postgres|postgresql):\/\//, "");

    // Extract authentication and host information
    const [authHostPort, database] = cleanUri.split("/");
    const [authPart, hostPort] = authHostPort?.split("@") || [];

    // Extract username and password
    const [username, password] = authPart?.split(":") || [];

    // Extract host and port
    const [host, port = "5432"] = hostPort?.split(":") || [];

    return {
      port: Number(port) || 5432,
      host: host || "localhost",
      database: database || "",
      username: decodeURIComponent(username || ""),
      password: password ? decodeURIComponent(password) : "",
    };
  } catch (error: unknown) {
    logger.error("Failed to parse PostgreSQL URI", { error });
    throw new Error("Invalid PostgreSQL URI format");
  }
}
