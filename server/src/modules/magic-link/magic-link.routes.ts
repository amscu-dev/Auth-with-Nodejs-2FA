import { Router } from "express";
import { magicLinkController } from "./magic-link.module";
import { authenticateMagicLinkToken } from "@/common/strategies/magic-link.strategy";

const magicLinkRoutes = Router();

magicLinkRoutes.post("/signup", magicLinkController.signUpWithMagicLink);
magicLinkRoutes.post("/signin", magicLinkController.signInWithMagicLink);
magicLinkRoutes.post("/resend-token", magicLinkController.resendMagicLink);
magicLinkRoutes.get(
  "/verify/:token",
  authenticateMagicLinkToken,
  magicLinkController.authenticateMagicLink
);

export default magicLinkRoutes;
