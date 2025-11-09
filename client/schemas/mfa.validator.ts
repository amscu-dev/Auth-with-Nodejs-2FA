import { z } from "zod";
import { totpSchema } from "./reusable/totp.schema";
import { backupCodeSchema } from "./reusable/backupCode.schema";

const mfaVerifySetupRequestBodySchema = z.object({
  code: totpSchema,
});

const mfaRevokeRequestBodySchema = z.object({
  code: totpSchema,
});

const mfaDisableWithBackUpCodeRequestBodySchema = z.object({
  backupCode: backupCodeSchema,
});

const mfaLoginWithBackUpCodeRequestBodySchema = z.object({
  backupCode: backupCodeSchema,
});

const mfaVerifyCodeLoginRequestBodySchema = z.object({
  code: totpSchema,
});

const mfaVerifyCodeForgotPasswordRequestBodySchema = z.object({
  code: totpSchema,
});

export const MfaRequestSchema = {
  verifySetup: mfaVerifySetupRequestBodySchema,
  revoke: mfaRevokeRequestBodySchema,
  disableWithBackupCode: mfaDisableWithBackUpCodeRequestBodySchema,
  loginWithBackupCode: mfaLoginWithBackUpCodeRequestBodySchema,
  verifyCodeLogin: mfaVerifyCodeLoginRequestBodySchema,
  verifyCodeForgotPassword: mfaVerifyCodeForgotPasswordRequestBodySchema,
};
