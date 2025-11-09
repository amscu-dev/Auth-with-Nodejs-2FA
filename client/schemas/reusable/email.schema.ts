import { z } from "zod";

const EMAIL_MAX_SIZE = 64;
const EMAIL_MIN_SIZE = 5;
const ALLOWED_EMAIL_PROVIDERS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
];

export const emailSchema = z
  .email({ message: "Invalid email format." })
  .trim()
  .min(EMAIL_MIN_SIZE, { message: "Email is required." })
  .max(EMAIL_MAX_SIZE, { message: "Email must not exceed 64 characters." })
  .refine(
    (val) => {
      const domain = val.split("@")[1]?.toLowerCase();
      return domain ? ALLOWED_EMAIL_PROVIDERS.includes(domain) : false;
    },
    {
      message: "Email provider not accepted. Please use a different email.",
    }
  );
