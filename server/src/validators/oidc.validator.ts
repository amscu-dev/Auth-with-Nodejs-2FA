import z from "zod";

const OIDCQueryParamsShema = z.object({
  code: z.string().min(1, "Code is required.."),
  state: z.string().min(1, "Code is required.."),
});

export const OIDCRequestSchema = {
  verifyParams: OIDCQueryParamsShema,
};
