import z from "zod";
import { magicLinkRegisterSchema } from "../validators/magic-link.validator";

export type MagicLinkRegisterData = z.infer<typeof magicLinkRegisterSchema>;
