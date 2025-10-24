import z from "zod";

export const verifyOIDCParams = z.object({
  code: z.string().trim(),
  state: z.string().trim(),
});
