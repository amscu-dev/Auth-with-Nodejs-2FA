import { Router } from "express";
import { passkeyController } from "./passkey.module";
import { authenticateJWT } from "@/common/strategies/jwt.strategy";

const passkeyRoutes = Router();

passkeyRoutes.post(
  "/register/init",
  passkeyController.generatePasskeySignUpSession
);
passkeyRoutes.post(
  "/register/verify",
  passkeyController.verifyPasskeySignUpSession
);
passkeyRoutes.post(
  "/authenticate/init",
  passkeyController.generatePasskeySignInSession
);
passkeyRoutes.post(
  "/authenticate/verify",
  passkeyController.verifyPasskeySignInSession
);

passkeyRoutes.post(
  "/add-passkey/init/:userid",
  authenticateJWT,
  passkeyController.generatePasskeyAddSession
);
passkeyRoutes.post(
  "/add-passkey/verify/:userid",
  authenticateJWT,
  passkeyController.verifyPasskeyAddSession
);
passkeyRoutes.post(
  "/remove-key/init/:userid/:credentialid",
  authenticateJWT,
  passkeyController.generatePasskeyRemoveSession
);
passkeyRoutes.delete(
  "/remove-key/verify/:userid/:credentialid",
  authenticateJWT,
  passkeyController.verifyPasskeyRemoveSession
);

passkeyRoutes.get(
  "/all/:userid",
  authenticateJWT,
  passkeyController.getAllUserPasskeys
);
export default passkeyRoutes;
