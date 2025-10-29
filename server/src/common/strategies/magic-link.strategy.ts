import {
  VerifyCallbackWithRequest,
  ExtractJwt,
  StrategyOptionsWithRequest,
  Strategy as JwtStrategy,
} from "passport-jwt";
import { AuthenticationException } from "../utils/catch-errors";
import { config } from "@/config/app.config";
import { ErrorCode } from "../enums/error-code.enum";
import passport, { PassportStatic } from "passport";
import { NextFunction, Request, Response } from "express";
import { MagicLinkTokenPayload } from "../utils/jwt";
import { MagicLinkModel } from "@/database/models/magicLinkSession.model";

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([(req) => req.params.token]),
  issuer: config.APP_NAME,
  audience: ["user"],
  algorithms: ["HS256"],
  secretOrKey: config.MAGIC_LINK_TOKEN.SECRET_KEY, // sau cheia ta HS256
  passReqToCallback: true,
};

const verifyCallback: VerifyCallbackWithRequest = async (
  req,
  payload: MagicLinkTokenPayload,
  done
) => {
  try {
    if (payload.type !== "magic-link") {
      return done(
        new AuthenticationException(
          "Invalid auth token type.",
          ErrorCode.MAGIC_LINK_INVALID_TOKEN_TYPE
        ),
        false
      );
    }
    const magicLinkSession = await MagicLinkModel.findById(
      payload.magicLinkSession
    );

    if (!magicLinkSession || magicLinkSession.consumed) {
      throw new AuthenticationException(
        "Magic link is invalid or has already been used.",
        ErrorCode.MAGIC_LINK_INVALID_OR_CONSUMED
      );
    }

    done(null, magicLinkSession);
  } catch (err) {
    done(err, false);
  }
};

const mfaStrategy = new JwtStrategy(options, verifyCallback);

export const setupMagicLinkStrategy = (passport: PassportStatic) => {
  passport.use("magic-link-token", mfaStrategy);
};

export const authenticateMagicLinkToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "magic-link-token",
    { session: false },
    (
      err: any,
      magicLinkSession: Express.MagicLinkSession,
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
      if (magicLinkSession && !err) {
        req.magicLinkSession = magicLinkSession;
      }
      if (err) {
        next(err);
      }
      next();
    }
  )(req, res, next);
};
