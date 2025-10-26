import { MagicLinkController } from "./magic-link.controller";
import { MagicLinkService } from "./magic-link.service";

const magicLinkService = new MagicLinkService();
const magicLinkController = new MagicLinkController(magicLinkService);

export { magicLinkService, magicLinkController };
