import { db } from "@/database";
import { authMiddleware } from "@/middleware/auth";
import { init } from "@/middleware/init";
import { rateLimiter } from "@/middleware/rate-limiter";
import { docs } from "@/pkg/docs";
import { appEnv } from "@/pkg/env/env";
import { newApp } from "@/pkg/hono/app";
import {
  setupHealthReporting,
  setupHonoListener,
  setupRouteLogger,
  setupRuntime,
} from "@/pkg/hono/setup";
import { refreshFaceApiDescriptorsStorage } from "@/pkg/storage/face-api";
import { setupApiRoutes } from "@/routes";
import { faceApi } from "@/services/faceApi";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { seconds } from "itty-time";

const app = newApp();

app.use("*", init());
app.use("*", cors({ credentials: true, origin: "*" }));
app.use("*", secureHeaders());
app.use("*", authMiddleware);
// * Rate limiter middleware
app.use(
  "*",
  rateLimiter(
    {
      points: 50,
      duration: seconds("1 hour"),
      blockDuration: seconds("10 minutes"),
    },
    "fail",
  ),
);
app.use(
  "*",
  rateLimiter(
    { points: 1000, duration: seconds("1 minute"), blockDuration: seconds("10 minutes") },
    "limit",
  ),
);

// * Serve static public files in development
if (appEnv.NODE_ENV !== "production") {
  app.use(
    "/public/uploads/faces/*",
    serveStatic({
      root: "./uploads/faces",
      rewriteRequestPath: (path) => path.replace(/^\/public\/uploads\/faces/, ""),
    }),
  );
}

setupHealthReporting(app, { service: "ApiService" });
setupRouteLogger(app, appEnv.NODE_ENV === "development");
await refreshFaceApiDescriptorsStorage({
  db: db,
  faceApi: faceApi,
});

// * Register API routes
setupApiRoutes(app);

// Init OpenAPI docs
docs(app, appEnv.NODE_ENV !== "production");

const cleanup = setupHonoListener(app, { port: appEnv.PORT });

setupRuntime([cleanup]);
