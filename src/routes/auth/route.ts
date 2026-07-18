import type { App } from "@/pkg/hono/app";
import { registerV1ApiAdminSignInWithEmailAndPassword } from "@/routes/auth/v1_api_admin_sign_in_with_email_and_password";

export const setupAuthApiRoutes = (app: App) => {
  // registerV1ApiFace(app);
  registerV1ApiAdminSignInWithEmailAndPassword(app);
};
