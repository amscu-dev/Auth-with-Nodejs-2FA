import z from "zod";
import {
  loginSchema,
  passwordSchema,
  registerSchema,
} from "@/common/validators/auth.validator";

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type PasswordType = z.infer<typeof passwordSchema>;
