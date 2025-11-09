import { AuthRequestSchema } from "@/validators/auth.validator";
import { passwordSchema } from "@/validators/reusable/password.schema";
import z from "zod";

export type RegisterData = z.infer<typeof AuthRequestSchema.signUp>;
export type LoginData = z.infer<typeof AuthRequestSchema.signIn>;
export type PasswordType = z.infer<typeof passwordSchema>;
