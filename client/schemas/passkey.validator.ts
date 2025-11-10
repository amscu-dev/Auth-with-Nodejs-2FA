import z from "zod";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/browser";
import { nameSchema } from "./reusable/name.schema";
import { emailSchema } from "./reusable/email.schema";
import { userIdSchema } from "./reusable/userid.schema";

export const clientDataJSONSchema = z.object({
  type: z.enum(["webauthn.create", "webauthn.get"]),
  challenge: z.string(),
  origin: z.string().url(),
  crossOrigin: z.boolean().optional(),
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

const passkeySignUpInitRequestBodySchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

const passkeySignUpVerifyRequestBodySchema = z.object({
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

const passkeySignInVerifyRequestBodySchema = z.object({
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

const getAllPaskeySchema = z.object({
  userid: userIdSchema,
});

const addPasskeyRequestSchema = z.object({
  userid: userIdSchema,
});

const removePasskeyRequestSchema = z.object({
  userid: userIdSchema,
  credentialid: z.string().trim(),
});

// *
const publicKeyCredentialCreationOptionsSchema = z.object({
  attestation: z.enum(["direct", "enterprise", "indirect", "none"]),
  authenticatorSelection: z.object({
    requireResidentKey: z.boolean(),
    residentKey: z.enum(["required"]),
    userVerification: z.enum(["required"]),
  }),
  challenge: z.string().min(1),
  excludeCredentials: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(["public-key"]),
      transports: z.array(transportEnum),
    })
  ),
  extensions: z.object({
    credProps: z.boolean(),
  }),
  hints: z.array(z.enum(["hybrid", "security-key", "client-device"])),
  pubKeyCredParams: z.array(
    z.object({
      alg: z.number(),
      type: z.enum(["public-key"]),
    })
  ),
  rp: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  timeout: z.number(),
  user: z.object({
    displayName: z.string().min(1),
    id: z.string().min(1),
    name: z.string().min(1),
  }),
}) satisfies z.ZodType<PublicKeyCredentialCreationOptionsJSON>;

const publicKeyCredentialAuthenticateOptionsSchema = z.object({
  allowCredentials: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(["public-key"]),
      transports: z.array(transportEnum),
    })
  ),
  challenge: z.string().min(1),
  rpId: z.string().min(1),
  timeout: z.number(),
  userVerification: z.enum(["required"]),
}) satisfies z.ZodType<PublicKeyCredentialRequestOptionsJSON>;

export const passkeySignInInitResponseBodySchema = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string().min(1),
  metadata: z.object({
    requestId: z.string(),
    timestamp: z.iso.datetime(),
  }),
  data: z.object({
    publicKeyCredentialRequestOptions:
      publicKeyCredentialAuthenticateOptionsSchema,
  }),
});

export const passkeySignUpInitResponseBodySchema = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string().min(1),
  metadata: z.object({
    requestId: z.string(),
    timestamp: z.iso.datetime(),
  }),
  data: z.object({
    publicKeyOpts: publicKeyCredentialCreationOptionsSchema,
  }),
});

export const PasskeyRequestSchema = {
  signUpInit: passkeySignUpInitRequestBodySchema,
  signUpVerify: passkeySignUpVerifyRequestBodySchema,
  signInVerify: passkeySignInVerifyRequestBodySchema,
  getAllPasskey: getAllPaskeySchema,
  addPasskey: addPasskeyRequestSchema,
  removePasskey: removePasskeyRequestSchema,
};

export const PasskeyResponseSchema = {
  signUpInit: passkeySignUpInitResponseBodySchema,
  signInInit: passkeySignInInitResponseBodySchema,
};
