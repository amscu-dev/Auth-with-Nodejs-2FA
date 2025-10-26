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
  oidcSessionController.authenticateGoogleUser
);

// ! GITHUB
oidcSessionRoutes.get(
  "/github/auth-url",
  oidcSessionController.getGithubAuthorizationURL
);
oidcSessionRoutes.get(
  "/github/callback",
  oidcSessionController.authenticateGithubUser
);
export default oidcSessionRoutes;
