process.on("uncaughtException", (err: any) => {
  console.log("Uncaught Exceptions! 📛 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err: any) => {
  console.error(err?.name, err?.message);
  console.log("Unhandled Promise Rejection! 📛 Shutting down...");
  // server încă nu există aici dacă îl definești după importuri
  server?.close(() => {
    process.exit(1);
  });
});

import "module-alias/register";
import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { config } from "./config/app.config";
import connectDatabase from "./database/database";
import { errorHandler as GlobalErrorHandler } from "./middlewares/errorHandler";
import { HTTPSTATUS } from "./config/http.config";
import authRoutes from "./modules/auth/auth.routes";
import passport from "./middlewares/passport";
import { authenticateJWT } from "./common/strategies/jwt.strategy";
import sessionRoutes from "./modules/session/session.routes";
import addRequestId from "./middlewares/requestId";
import mfaRoutes from "./modules/mfa/mfa.routes";
import oidcSessionRoutes from "./modules/oidc-session/oidc-sesion.routes";
import magicLinkRoutes from "./modules/magic-link/magic-link.routes";
import { NotFoundException } from "./common/utils/catch-errors";
import { ErrorCode } from "./common/enums/error-code.enum";
import passkeyRoutes from "./modules/passkey/passkey.routes";
import addRequestHeaders from "./middlewares/addHeaders";
import addInfoAsyncLocalStorage from "./middlewares/addInfoAsyncLocalStorage";

// ! Initialize app
const app = express();

// ! Library Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: config.APP_ORIGIN }));
app.use(cookieParser());
app.use(passport.initialize());

// ! Custom General Middlewares
app.use(addRequestId);
app.use(addRequestHeaders);
app.use(addInfoAsyncLocalStorage);

// ! Health endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(HTTPSTATUS.OK).json({
    message: "OK",
  });
});

// ! Routes
app.use(`${config.BASE_PATH}/auth`, authRoutes);
app.use(`${config.BASE_PATH}/session`, authenticateJWT, sessionRoutes);
app.use(`${config.BASE_PATH}/mfa`, mfaRoutes);
app.use(`${config.BASE_PATH}/oidc`, oidcSessionRoutes);
app.use(`${config.BASE_PATH}/magic-link`, magicLinkRoutes);
app.use(`${config.BASE_PATH}/passkey`, passkeyRoutes);

// ! Catch-all routes
app.all("{*splat}", (req, res, next) => {
  console.log(req.originalUrl);
  next(
    new NotFoundException(
      `Can't find ${req.originalUrl} on this server!`,
      ErrorCode.RESOURCE_NOT_FOUND
    )
  );
});

// ! Global error handler
app.use(GlobalErrorHandler);

// ! Start Server
const server = app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});
