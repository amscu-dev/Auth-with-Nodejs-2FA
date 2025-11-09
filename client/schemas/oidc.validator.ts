import z from "zod";

const OIDCQueryParamsShema = z.object({
  code: z
    .string({ message: "Code is required." })
    .min(20, "Code seems too short.")
    .max(200, "Code seems too long.")
    .regex(/^[\w\-._~]+$/, "Code contains invalid characters."),

  state: z
    .string({ message: "State is required." })
    .min(10, "State seems too short.")
    .max(200, "State seems too long.")
    .regex(/^[\w\-._~]+$/, "State contains invalid characters."),
});

export const OIDCRequestSchema = {
  verifyParams: OIDCQueryParamsShema,
};
