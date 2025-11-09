import z from "zod";

const MIN_PASSWORD_SIZE = 8;

export const passwordSchema = z
  .string()
  .trim()
  .min(MIN_PASSWORD_SIZE, {
    message: "Password must be at least 8 characters long.",
  })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter.",
  })
  .regex(/\d/, { message: "Password must contain at least one number." })
  .regex(/[!@#$%^&*()_\-+=\[\]{}|\\;:'",.<>/?]/, {
    message: "Password must contain at least one special character.",
  });
