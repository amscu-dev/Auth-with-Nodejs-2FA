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
  PASSWORD_SECRET_PEPPER: getEnv("PASSWORD_SECRET_PEPPER"),
  MFA_TOKEN: {
    EXPIRES_IN: getEnv("MFA_TOKEN_EXPIRES_IN", "5m") as ms.StringValue,
    SECRET_KEY: getEnv("MFA_TOKEN_SECRET_KEY"),
  },
  MAGIC_LINK_TOKEN: {
    EXPIRES_IN: getEnv("MAGIC_LINK_TOKEN_EXPIRES_IN", "5m") as ms.StringValue,
    SECRET_KEY: getEnv("MAGIC_LINK_TOKEN_SECRET_KEY"),
  },
  GOOGLE_OAUTH_CLIENT_ID: getEnv("GOOGLE_OAUTH_CLIENT_ID"),
  GOOGLE_OAUTH_SECRET_KEY: getEnv("GOOGLE_OAUTH_SECRET_KEY"),
  GOOGLE_OAUTH_REDIRECT_URI: getEnv("GOOGLE_OAUTH_REDIRECT_URI"),
  GITHUB_OAUTH_CLIENT_ID: getEnv("GITHUB_OAUTH_CLIENT_ID"),
  GITHUB_OAUTH_SECRET_KEY: getEnv("GITHUB_OAUTH_SECRET_KEY"),
  GITHUB_OAUTH_REDIRECT_URI: getEnv("GITHUB_OAUTH_REDIRECT_URI"),
  CRYPTO_SYMMETRIC_KEY: getEnv("CRYPTO_SYMMETRIC_KEY"),
  MAILER_SENDER: getEnv("MAILER_SENDER"),
  RESEND_API_KEY: getEnv("RESEND_API_KEY"),
});
export const config = appConfig();
