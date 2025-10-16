import { z } from "zod";

export const emailSchema = z.email().trim().min(1).max(255);
export const passwordSchema = z.string().trim().min(8).max(255);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    userAgent: z.string().optional(),
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
});
