import { z } from "zod";

export const emailSchema = z.email().trim().min(1).max(255);
export const passwordSchema = z
  .string()
  .nonempty({ message: "Password is required" })
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must start with a capital letter" })
  .regex(/[\W_]/, {
    message: "Password must contain at least one special character",
  });

export const verficationCodeSchema = z.string().trim().min(1).max(255);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Password does not match",
        path: ["confirmPassword"],
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const verificationEmailSchema = z.object({
  code: verficationCodeSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  verificationCode: verficationCodeSchema,
});
