import z from "zod";

const TOTP_SIZE = 6;

export const totpSchema = z
  .string()
  .min(1, { message: "Verification code is required" })
  .length(TOTP_SIZE, `The code must be exactly ${TOTP_SIZE} digits long.`)
  .regex(/^\d+$/, "The code must contain only valid number (0–9).");
