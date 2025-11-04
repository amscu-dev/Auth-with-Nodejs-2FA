import { AuthenticateAccessJWTToken } from "@/common/strategies/access-token-jwt.strategy";
import { Router } from "express";
import { mfaController } from "./mfa.module";
import { AuthenticateMfaJWTToken } from "@/common/strategies/mfa-token-jwt.strategy";
import { requireRegularAuthMethod } from "@/middlewares/requireRegularAuthMethod ";

const mfaRoutes = Router();

mfaRoutes.get(
  "/setup",
  AuthenticateAccessJWTToken,
  requireRegularAuthMethod,
  mfaController.generateMFASetup
);
mfaRoutes.post(
  "/verify/setup",
  AuthenticateAccessJWTToken,
  requireRegularAuthMethod,
  mfaController.verifyMFASetup
);
mfaRoutes.patch(
  "/revoke",
  AuthenticateAccessJWTToken,
  requireRegularAuthMethod,
  mfaController.revokeMFA
);

mfaRoutes.post(
  "/backup-code/consume",
  AuthenticateAccessJWTToken,
  requireRegularAuthMethod,
  mfaController.disableMFAWithBackupCode
);
mfaRoutes.post(
  "/backup-code/login",
  AuthenticateMfaJWTToken,
  requireRegularAuthMethod,
  mfaController.loginWithBackupCode
);

mfaRoutes.post(
  "/verify/login",
  AuthenticateMfaJWTToken,
  requireRegularAuthMethod,
  mfaController.verifyMFAForLogin
);
mfaRoutes.post(
  "/verify/forgot-password",
  AuthenticateMfaJWTToken,
  requireRegularAuthMethod,
  mfaController.verifyMFAForChangingPassword
);

export default mfaRoutes;
