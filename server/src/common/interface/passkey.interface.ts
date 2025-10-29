import z from "zod";
import {
  clientDataJSONSchema,
  passkeyRegisterSchema,
} from "../validators/passkey.validator";

export type PasskeyRegisterData = z.infer<typeof passkeyRegisterSchema>;
export type ClientJSONData = z.infer<typeof clientDataJSONSchema>;
