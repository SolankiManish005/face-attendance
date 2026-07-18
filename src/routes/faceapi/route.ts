import type { App } from "@/pkg/hono/app";
import { registerV1ApiFaceapi } from "./v1_api_faceapi";

export const setupFaceapiApiRoutes = (app: App) => {
  registerV1ApiFaceapi(app);
};
