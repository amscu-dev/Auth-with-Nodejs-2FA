import { Router } from "express";
import { oidcSessionController } from "./oidc-session.modules";

const oidcSessionRoutes = Router();

// ! GOOGLE
oidcSessionRoutes.get(
  "/google/auth-url",
  oidcSessionController.getGoogleAuthorizationURL
);

oidcSessionRoutes.get(
  "/google/callback",
  oidcSessionController.authenticateUser
);

export default oidcSessionRoutes;
