import { logger } from "@/pkg/logger/logger";
import { Argon2id } from "oslo/password";

const password = "admin@123456";

const hashedPass = await new Argon2id().hash(password);

logger.log("🚀 ~ hashedPass:", hashedPass);
