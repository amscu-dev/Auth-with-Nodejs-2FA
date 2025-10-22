import jwt from "jsonwebtoken";
import {
  VerifyCallbackWithRequest,
  ExtractJwt,
  StrategyOptionsWithRequest,
  Strategy as JwtStrategy,
} from "passport-jwt";
import { AuthenticationException } from "../utils/catch-errors";
import { config } from "@/config/app.config";
import { ErrorCode } from "../enums/error-code.enum";
import { userService } from "@/modules/user/user.module";
import passport, { PassportStatic } from "passport";
import { NextFunction, Request, Response } from "express";

interface MFATokenPayload extends jwt.JwtPayload {
  sub: string;
  userId: string;
  type: "mfa";
  loginAttemptId: string;
}

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => req.cookies?.mfaToken || null,
  ]),
  issuer: config.APP_NAME,
  audience: ["user"],
  algorithms: ["HS256"],
  secretOrKey: config.MFA_TOKEN.SECRET_KEY, // sau cheia ta HS256
  passReqToCallback: true,
};

const verifyCallback: VerifyCallbackWithRequest = async (
  req,
  payload: MFATokenPayload,
  done
) => {
  try {
    if (payload.type !== "mfa") {
      return done(
        new AuthenticationException(
          "Invalid MFA token type.",
          ErrorCode.AUTH_INVALID_TOKEN
        ),
        false
      );
    }

    const user = await userService.findUserById(payload.userId);
    if (!user) {
      return done(
        new AuthenticationException(
          "MFA authentication failed: user not found.",
          ErrorCode.AUTH_USER_NOT_FOUND
        ),
        false
      );
    }

    req.user = user;
    req.loginAttemptId = payload.loginAttemptId;
    done(null, user);
  } catch (err) {
    done(err, false);
  }
};

const mfaStrategy = new JwtStrategy(options, verifyCallback);

export const setupMfaStrategy = (passport: PassportStatic) => {
  passport.use("mfa-token", mfaStrategy);
};

export const authenticateMFA = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "mfa-token",
    { session: false },
    (
      err: any,
      user: Express.User,
      info: { name: string; message: string } | undefined
    ) => {
      if (info) {
        if (info.name === "JsonWebTokenError") {
          throw new AuthenticationException(
            `Invalid MFA token.`,
            ErrorCode.AUTH_INVALID_TOKEN
          );
        }
        if (info.name === "TokenExpiredError") {
          throw new AuthenticationException(
            `MFA token expired.`,
            ErrorCode.AUTH_TOKEN_EXPIRED
          );
        }
      }
      if (user && !err) {
        req.user = user;
      }
      if (err) {
        next(err);
      }
      next();
    }
  )(req, res, next);
};
