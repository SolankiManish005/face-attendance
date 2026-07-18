import type { Database } from "@/database/db";
import type { DatabaseService } from "@/services/database";
import type { FaceApi } from "@/services/faceApi";
import type { HttpBindings } from "@hono/node-server";
import type { Session } from "lucia";
import type { User } from "lucia";
import type { Logger } from "winston";

export type ServiceContext = {
  db: Database;
  faceApi: FaceApi;
  databaseService: DatabaseService;
};
export type HonoEnv = {
  Bindings: HttpBindings;
  Variables: {
    services: ServiceContext;
    requestId: string;
    logger: Logger;
    user: User | null;
    session: Session | null;
  };
};
