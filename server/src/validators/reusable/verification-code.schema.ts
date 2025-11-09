import z from "zod";

export const verificationCodeSchema = z
  .string()
  .min(1, { message: "Verification code is required." })
  .length(25, { message: "Verification code has an invalid format." })
  .regex(/^[0-9a-f]{25}$/, {
    message: "Verification code has an invalid format.",
  });
