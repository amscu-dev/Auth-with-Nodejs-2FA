import { Router } from "express";
import { passkeyController } from "./passkey.module";
import { AuthenticateAccessJWTToken } from "@/common/strategies/access-token-jwt.strategy";

const passkeyRoutes = Router();

passkeyRoutes.post(
  "/signup/init",
  passkeyController.generatePasskeySignUpSession
);
passkeyRoutes.post(
  "/signup/verify",
  passkeyController.verifyPasskeySignUpSession
);
passkeyRoutes.post(
  "/signin/init",
  passkeyController.generatePasskeySignInSession
);
passkeyRoutes.post(
  "/signin/verify",
  passkeyController.verifyPasskeySignInSession
);

passkeyRoutes.post(
  "/add-passkey/init/:userid",
  AuthenticateAccessJWTToken,
  passkeyController.generatePasskeyAddSession
);
passkeyRoutes.post(
  "/add-passkey/verify/:userid",
  AuthenticateAccessJWTToken,
  passkeyController.verifyPasskeyAddSession
);
passkeyRoutes.post(
  "/remove-key/init/:userid/:credentialid",
  AuthenticateAccessJWTToken,
  passkeyController.generatePasskeyRemoveSession
);
passkeyRoutes.delete(
  "/remove-key/verify/:userid/:credentialid",
  AuthenticateAccessJWTToken,
  passkeyController.verifyPasskeyRemoveSession
);

passkeyRoutes.get(
  "/all/:userid",
  AuthenticateAccessJWTToken,
  passkeyController.getAllUserPasskeys
);
export default passkeyRoutes;
