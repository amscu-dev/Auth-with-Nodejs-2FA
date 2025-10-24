import { OIDCSessionController } from "./oidc-session.controller";
import { OIDCSessionService } from "./oidc-session.service";

const oidcSessionService = new OIDCSessionService();
const oidcSessionController = new OIDCSessionController(oidcSessionService);

export { oidcSessionService, oidcSessionController };
