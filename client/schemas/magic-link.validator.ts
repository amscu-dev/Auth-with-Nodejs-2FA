import z from "zod";
import { nameSchema } from "./reusable/name.schema";
import { emailSchema } from "./reusable/email.schema";

const magicLinkSignUpRequestBodySchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

const magicLinkSignInRequestBodySchema = z.object({
  email: emailSchema,
});

const magicLinkResendLinkRequestBodySchema = z.object({
  email: emailSchema,
});

export const MagicLinkRequestSchema = {
  signUp: magicLinkSignUpRequestBodySchema,
  signIn: magicLinkSignInRequestBodySchema,
  resendLink: magicLinkResendLinkRequestBodySchema,
};
