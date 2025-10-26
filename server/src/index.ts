import "module-alias/register";
import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { config } from "./config/app.config";
import connectDatabase from "./database/database";
import { errorHandler } from "./middlewares/errorHandler";
import { HTTPSTATUS } from "./config/http.config";
import authRoutes from "./modules/auth/auth.routes";
import passport from "./middlewares/passport";
import { authenticateJWT } from "./common/strategies/jwt.strategy";
import sessionRoutes from "./modules/session/session.routes";
import addRequestId from "./middlewares/requestId";
import mfaRoutes from "./modules/mfa/mfa.routes";
import oidcSessionRoutes from "./modules/oidc-session/oidc-sesion.routes";
import magicLinkRoutes from "./modules/magic-link/magic-link.routes";
const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: config.APP_ORIGIN }));
app.use(addRequestId);
app.use(cookieParser());
app.use(passport.initialize());

// * TODO implement health endpoint
// * TODO catch all routes
app.get("/", (req: Request, res: Response) => {
  res.status(HTTPSTATUS.OK).json({
    message: "OK",
  });
});

// ! Auth
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoutes);
app.use(`${BASE_PATH}/mfa`, mfaRoutes);
app.use(`${BASE_PATH}/oidc`, oidcSessionRoutes);
app.use(`${BASE_PATH}/magic-link`, magicLinkRoutes);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});
