import z from "zod";

export const magicLinkRegisterSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.email().trim().min(1).max(255),
});
