import { Router } from "express";
import { magicLinkController } from "./magic-link.module";
import { AuthenticateMagicLinkJWTToken } from "@/common/strategies/magic-link-token-jwt.strategy";

const magicLinkRoutes = Router();

magicLinkRoutes.post("/signup", magicLinkController.signUpWithMagicLink);
magicLinkRoutes.post("/signin", magicLinkController.signInWithMagicLink);
magicLinkRoutes.post("/resend", magicLinkController.resendMagicLink);
magicLinkRoutes.get(
  "/verify/:token",
  AuthenticateMagicLinkJWTToken,
  magicLinkController.authenticateMagicLink
);

export default magicLinkRoutes;
