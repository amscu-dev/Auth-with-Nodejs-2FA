import z from "zod";
import { loginSchema, registerSchema } from "../validators/auth.validator";

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
