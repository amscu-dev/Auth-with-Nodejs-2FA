import z from "zod";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

export const getAllPaskeySchema = z.object({
  userid: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid user ID format",
  }),
});

export const passkeyRegisterSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.email().trim().min(1).max(255),
});

export const addPasskeyRequestSchema = z.object({
  userid: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid user ID format",
  }),
});

export const removePasskeyRequestSchema = z.object({
  userid: z
    .string()
    .trim()
    .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
      message: "Invalid user ID format",
    }),
  credentialid: z.string().trim(),
});

const transportEnum = z.enum([
  "ble",
  "cable",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
]);

export const clientDataJSONSchema = z.object({
  type: z.enum(["webauthn.create", "webauthn.get"]),
  challenge: z.string(),
  origin: z.string().url(),
  crossOrigin: z.boolean().optional(),
});

export const passkeyRegistrationResponseJSONSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  type: z.literal("public-key"),
  response: z.object({
    attestationObject: z.string(),
    clientDataJSON: z.string(),
    authenticatorData: z.string().optional(),
    publicKey: z.string().optional(),
    publicKeyAlgorithm: z.number().optional(),
    transports: z.array(transportEnum).optional(),
  }),
  authenticatorAttachment: z.enum(["cross-platform", "platform"]).optional(),
  clientExtensionResults: z.object({
    appid: z.boolean().optional(),
    credProps: z
      .object({
        rk: z.boolean().optional(),
      })
      .optional(),
    hmacCreateSecret: z.boolean().optional(),
  }),
}) satisfies z.ZodType<RegistrationResponseJSON>;

export const passkeyAuthenticationResponseJSONSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  type: z.literal("public-key"),
  authenticatorAttachment: z.enum(["cross-platform", "platform"]).optional(),
  clientExtensionResults: z.object({
    appid: z.boolean().optional(),
    credProps: z
      .object({
        rk: z.boolean().optional(),
      })
      .optional(),
    hmacCreateSecret: z.boolean().optional(),
  }),
  response: z.object({
    clientDataJSON: z.string(),
    authenticatorData: z.string(),
    signature: z.string(),
    userHandle: z.string(),
  }),
}) satisfies z.ZodType<AuthenticationResponseJSON>;
