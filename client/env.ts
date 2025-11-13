import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.url(),
    NEXT_PUBLIC_LOGIN_REDIRECT: z.string().min(1),
    NEXT_PUBLIC_LOGOUT_REDIRECT: z.string().min(1),
    NEXT_PUBLIC_FAILED_LOGIN_REDIRECT: z.string().min(1),
  },
  server: {
    JWT_TOKEN_ISSUER: z.string().min(1),
    JWT_TOKEN_AUDIENCE: z.string().min(1),
    JWT_ACCESS_TOKEN_PUBLIC_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_LOGIN_REDIRECT: process.env.NEXT_PUBLIC_LOGIN_REDIRECT,
    NEXT_PUBLIC_LOGOUT_REDIRECT: process.env.NEXT_PUBLIC_LOGOUT_REDIRECT,
    NEXT_PUBLIC_FAILED_LOGIN_REDIRECT:
      process.env.NEXT_PUBLIC_FAILED_LOGIN_REDIRECT,
  },
});
