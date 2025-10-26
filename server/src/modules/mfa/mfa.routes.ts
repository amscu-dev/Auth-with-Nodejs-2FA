import { authenticateJWT } from "@/common/strategies/jwt.strategy";
import { Router } from "express";
import { mfaController } from "./mfa.module";
import { authenticateMFA } from "@/common/strategies/mfa-token.strategy";
import { requireRegularAuthMethod } from "@/middlewares/requireRegularAuthMethod ";

const mfaRoutes = Router();

mfaRoutes.get(
  "/setup",
  authenticateJWT,
  requireRegularAuthMethod,
  mfaController.generateMFASetup
);
mfaRoutes.post(
  "/verify",
  authenticateJWT,
  requireRegularAuthMethod,
  mfaController.verifyMFASetup
);
mfaRoutes.patch(
  "/revoke",
  authenticateJWT,
  requireRegularAuthMethod,
  mfaController.revokeMFA
);

mfaRoutes.post(
  "/backup-codes/consume",
  authenticateJWT,
  requireRegularAuthMethod,
  mfaController.disableMFAWithBackupCode
);
mfaRoutes.post(
  "/login-backup-code",
  authenticateMFA,
  requireRegularAuthMethod,
  mfaController.loginWithBackupCode
);

mfaRoutes.post(
  "/verify-login",
  authenticateMFA,
  requireRegularAuthMethod,
  mfaController.verifyMFAForLogin
);
mfaRoutes.post(
  "/verify-forgot-password",
  authenticateMFA,
  requireRegularAuthMethod,
  mfaController.verifyMFAForChangingPassword
);

export default mfaRoutes;
