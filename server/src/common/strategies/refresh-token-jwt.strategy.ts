import {
  VerifyCallbackWithRequest,
  ExtractJwt,
  StrategyOptionsWithRequest,
  Strategy as JwtStrategy,
} from "passport-jwt";
import { ErrorCode } from "../enums/error-code.enum";
import { config } from "@/config/app.config";
import passport, { PassportStatic } from "passport";
import { NextFunction, Request, Response } from "express";
import { userService } from "@/modules/user/user.module";
import decodeBase64 from "../utils/decodeBase64";
import { sessionService } from "@/modules/session/session.module";
import { RefreshTokenPayload } from "../utils/jwt";
import { asyncLocalStorage } from "../context/asyncLocalStorage";
import { UnauthorizedException } from "../utils/catch-errors";

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => {
      // ! 0. Evaluate the existence of token
      const accessToken = req.cookies.accessToken;
      if (!accessToken) {
        throw new UnauthorizedException(
          "Authentication failed, no authentication token provided.",
          ErrorCode.AUTH_TOKEN_NOT_FOUND
        );
      }
      return accessToken;
    },
  ]),
  issuer: config.AUTHENTICATION.TOKEN_ISSUER,
  audience: [config.AUTHENTICATION.TOKEN_AUDIENCE],
  algorithms: ["RS256"],
  secretOrKey: decodeBase64(config.JWT.REFRESH_PUBLIC_KEY),
  passReqToCallback: true,
};
const verifyCallback: VerifyCallbackWithRequest = async (
  req: Request,
  payload: RefreshTokenPayload,
  done
) => {
  try {
    // ! 01. Evaluate token type
    if (payload.type !== "refresh") {
      return done(
        new UnauthorizedException(
          "Authentication failed, expected an REFRESH token, but received a token of a different type.",
          ErrorCode.AUTH_REFRESH_TOKEN_TYPE_INVALID
        ),
        false
      );
    }
    // ! 02. Evaluate if user exists
    const user = await userService.findUserById(payload.userId);
    if (!user) {
      return done(
        new UnauthorizedException(
          "Authentication failed, the user associated with this token does not exist.",
          ErrorCode.AUTH_TOKEN_USER_NOT_FOUND
        ),
        false
      );
    }

    // ! 03. Evaluate validity of session asociated with token
    const session = await sessionService.findSessionById(payload.sessionId);
    if (!session) {
      return done(
        new UnauthorizedException(
          "Authentication failed, the refresh token session does not exist or is invalid. Please log in again.",
          ErrorCode.AUTH_REFRESH_TOKEN_SESSION_INVALID
        )
      );
    }
    if (session.expiredAt < new Date()) {
      return done(
        new UnauthorizedException(
          "Authentication failed, the refresh token session has expired. Please log in again to obtain a new refresh token.",
          ErrorCode.AUTH_REFRESH_TOKEN_SESSION_EXPIRED
        )
      );
    }
    // ! 04. Check if session user = token user
    const isNotUserSession = session.userId.id !== payload.userId;
    if (isNotUserSession) {
      return done(
        new UnauthorizedException(
          "Authentication failed, the access token does not match the current session.",
          ErrorCode.AUTH_TOKEN_SESSION_MISMATCH
        )
      );
    }
    // ! 05. Attach session to request
    req.sessionId = payload.sessionId;
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
};

const refreshTokenStrategy = new JwtStrategy(options, verifyCallback);

export const setupRefreshTokenStrategy = (passport: PassportStatic) => {
  passport.use("refresh-token", refreshTokenStrategy);
};

export const AuthenticateRefreshJWTToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "refresh-token",
    {
      session: false,
    },
    (
      err: any,
      user: Express.User,
      info: { name: string; message: string } | undefined
    ) => {
      if (info) {
        if (!user && info.name === "JsonWebTokenError") {
          throw new UnauthorizedException(
            `Authentication failed: ${info.message}`,
            ErrorCode.AUTH_TOKEN_INVALID
          );
        }
        if (!user && info.name === "TokenExpiredError") {
          throw new UnauthorizedException(
            `Authentication failed: ${info.message}`,
            ErrorCode.AUTH_TOKEN_EXPIRED
          );
        }
      }
      if (user && !err) {
        req.user = user;
        asyncLocalStorage.getStore()?.set("reqUserId", user.id);
      }
      if (err) {
        next(err);
      }
      next();
    }
  )(req, res, next);
};
