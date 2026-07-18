import path from "node:path";
import { db } from "@/database";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const __dirname = new URL(".", import.meta.url).pathname;
await migrate(db, { migrationsFolder: path.join(__dirname, "./migrations") });
