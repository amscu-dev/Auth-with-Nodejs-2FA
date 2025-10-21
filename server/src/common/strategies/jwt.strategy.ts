import jwt from "jsonwebtoken";
import {
  VerifyCallbackWithRequest,
  ExtractJwt,
  StrategyOptionsWithRequest,
  Strategy as JwtStrategy,
} from "passport-jwt";
import {
  AuthenticationException,
  UnauthorizedException,
} from "../utils/catch-errors";
import { ErrorCode } from "../enums/error-code.enum";
import { config } from "@/config/app.config";
import passport, { PassportStatic } from "passport";
import { NextFunction, Request, Response } from "express";
import { userService } from "@/modules/user/user.module";
import decodeBase64 from "../utils/decodeBase64";
import { sessionService } from "@/modules/session/session.module";

interface JwtPayload extends jwt.JwtPayload {
  sub: string;
  userId: string;
  sessionId: string;
}

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => {
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
        // goes directly into global error middleware without catchAsync
        throw new AuthenticationException(
          "Authentication failed: no access token provided.",
          ErrorCode.AUTH_TOKEN_NOT_FOUND
        );
      }
      return accessToken;
    },
  ]),
  issuer: config.APP_NAME,
  audience: ["usessr"],
  algorithms: ["RS256"],
  secretOrKey: decodeBase64(config.JWT.PUBLIC_KEY),
  passReqToCallback: true,
};
const verifyCallback: VerifyCallbackWithRequest = async (
  req: Request,
  payload: JwtPayload,
  done
) => {
  try {
    console.log("A TRECUT TOKENUL VERIFICAREA");
    // ! Check if user exists
    const user = await userService.findUserById(payload.userId);
    if (!user) {
      return done(
        // done functione send error directly into global error middleware
        new AuthenticationException(
          "Authentication failed: the user associated with this token does not exist.",
          ErrorCode.AUTH_USER_NOT_FOUND
        ),
        false
      );
    }

    // ! Check if session exists
    const session = await sessionService.findSessionById(payload.sessionId);

    if (!session) {
      return done(
        new AuthenticationException(
          "Authentication failed: the session associated with this it`s not a valid session.",
          ErrorCode.AUTH_SESSION_INVALID
        )
      );
    }

    // ! Check if user have this session
    const isNotUserSession = session.userId.toString() !== payload.userId;
    if (isNotUserSession) {
      return done(
        new AuthenticationException(
          "Authentication failed: the session associated with this it`s not a valid session.",
          ErrorCode.AUTH_SESSION_MISMATCH
        )
      );
    }

    // ! Attach session to request
    req.sessionId = payload.sessionId;

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
};

const strategy = new JwtStrategy(options, verifyCallback);

export const setupJwtStrategy = (passport: PassportStatic) => {
  passport.use("access-token", strategy);
};

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "access-token",
    {
      session: false,
    },
    (err: any, user: any, info: { name: string; message: string }) => {
      if (!user && info.name === "JsonWebTokenError") {
        throw new AuthenticationException(
          `Authentication failed: ${info.message}`,
          ErrorCode.AUTH_INVALID_TOKEN
        );
      }
      if (!user && info.name === "TokenExpiredError") {
        throw new AuthenticationException(
          `Authentication failed: ${info.message}`,
          ErrorCode.AUTH_TOKEN_EXPIRED
        );
      }

      if (user && !err) {
        req.user = user;
      }
      next();
    }
  )(req, res, next);
};
