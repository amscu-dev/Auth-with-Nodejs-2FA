import { z } from "zod";
import { emailSchema } from "./reusable/email.schema";
import { passwordSchema } from "./reusable/password.schema";
import { verificationCodeSchema } from "./reusable/verification-code.schema";
import { nameSchema } from "./reusable/name.schema";

const authSignUpRequestBodySchema = z
  .object({
    name: nameSchema,
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

const authSignInRequestBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const authVerificationEmailRequestBodySchema = z.object({
  code: verificationCodeSchema,
});

const authResendEmailRequestBodySchema = z.object({
  email: emailSchema,
});

const authCheckEmailRequestBodySchema = z.object({
  email: emailSchema,
});

const authForgotPasswordRequestBodySchema = z.object({
  email: emailSchema,
});

const authResetPasswordRequestBodySchema = z.object({
  verificationCode: verificationCodeSchema,
  password: passwordSchema,
});

export const AuthRequestSchema = {
  signUp: authSignUpRequestBodySchema,
  signIn: authSignInRequestBodySchema,
  verifyEmail: authVerificationEmailRequestBodySchema,
  resendEmail: authResendEmailRequestBodySchema,
  checkEmail: authCheckEmailRequestBodySchema,
  forgotPassword: authForgotPasswordRequestBodySchema,
  resetPassword: authResetPasswordRequestBodySchema,
};
