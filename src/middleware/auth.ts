import { lucia } from "@/pkg/auth/lucia";
import type { HonoEnv } from "@/pkg/hono/env";
import { createMiddleware } from "hono/factory";

// TODO: add opentelemetry tracing

function getBearerAuthToken(authToken?: string) {
  if (!authToken) {
    return null;
  }
  const [type, token] = authToken.split(" ");
  if (type !== "Bearer") {
    return null;
  }
  return token;
}

export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authorizationToken = c.req.header("Authorization");
  const token = getBearerAuthToken(authorizationToken);
  if (!token) {
    c.set("user", null);
    return next();
  }

  const { session, user } = await lucia.validateSession(token);

  if (session?.fresh) {
    c.get("logger").info("session needs to be refreshed");
  }

  c.set("user", user);
  c.set("session", session);

  return next();
});
