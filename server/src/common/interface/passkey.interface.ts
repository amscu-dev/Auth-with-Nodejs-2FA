import z from "zod";
import {
  clientDataJSONSchema,
  PasskeyRequestSchema,
} from "../../validators/passkey.validator";

export type PasskeyRegisterData = z.infer<
  typeof PasskeyRequestSchema.signUpInit
>;
export type ClientJSONData = z.infer<typeof clientDataJSONSchema>;
