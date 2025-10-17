import ms from "ms";
import { getEnv } from "../common/utils/get-env";
const appConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  APP_NAME: getEnv("APP_NAME", "MERN_AUTH_DEMO"),
  APP_ORIGIN: getEnv("APP_ORIGIN", "localhost"),
  DB_URI: getEnv("DB_URI"),
  PORT: getEnv("PORT", "5000"),
  BASE_PATH: getEnv("BASE_PATH", "/api/v1"),
  JWT: {
    PRIVATE_KEY: getEnv("JWT_PRIVATE_KEY"),
    PUBLIC_KEY: getEnv("JWT_PUBLIC_KEY"),
    EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "15m") as ms.StringValue,
    REFRESH_PRIVATE_KEY: getEnv("JWT_REFRESH_PRIVATE_KEY"),
    REFRESH_PUBLIC_KEY: getEnv("JWT_REFRESH_PUBLIC_KEY"),
    REFRESH_EXPIRES_IN: getEnv(
      "JWT_REFRESH_EXPIRES_IN",
      "30d"
    ) as ms.StringValue,
  },
});
export const config = appConfig();
