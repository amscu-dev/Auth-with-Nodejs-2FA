import { Router } from "express";
import { magicLinkController } from "./magic-link.module";

const magicLinkRoutes = Router();

magicLinkRoutes.post("/", magicLinkController.generateMagicLink);
magicLinkRoutes.get("/:token", magicLinkController.authenticateMagicLink);

export default magicLinkRoutes;
