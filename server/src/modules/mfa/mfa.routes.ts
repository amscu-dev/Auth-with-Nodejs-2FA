import { authenticateJWT } from "@/common/strategies/jwt.strategy";
import { Router } from "express";
import { mfaController } from "./mfa.module";
import { authenticateMFA } from "@/common/strategies/mfa-token.strategy";

const mfaRoutes = Router();

mfaRoutes.get("/setup", authenticateJWT, mfaController.generateMFASetup);
mfaRoutes.post("/verify", authenticateJWT, mfaController.verifyMFASetup);
mfaRoutes.patch("/revoke", authenticateJWT, mfaController.revokeMFA);

mfaRoutes.post(
  "/backup-codes/consume",
  authenticateJWT,
  mfaController.disableMFAWithBackupCode
);
mfaRoutes.post(
  "/login-backup-code",
  authenticateMFA,
  mfaController.loginWithBackupCode
);

mfaRoutes.post(
  "/verify-login",
  authenticateMFA,
  mfaController.verifyMFAForLogin
);
mfaRoutes.post(
  "/verify-forgot-password",
  authenticateMFA,
  mfaController.verifyMFAForChangingPassword
);

export default mfaRoutes;
