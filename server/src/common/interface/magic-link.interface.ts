import z from "zod";
import { MagicLinkRequestSchema } from "../../validators/magic-link.validator";

export type MagicLinkRegisterData = z.infer<
  typeof MagicLinkRequestSchema.signUp
>;
