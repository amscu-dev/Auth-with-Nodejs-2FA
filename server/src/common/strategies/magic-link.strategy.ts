import {
  VerifyCallbackWithRequest,
  ExtractJwt,
  StrategyOptionsWithRequest,
  Strategy as JwtStrategy,
} from "passport-jwt";
import { UnauthorizedException } from "../utils/catch-errors";
import { config } from "@/config/app.config";
import { ErrorCode } from "../enums/error-code.enum";
import passport, { PassportStatic } from "passport";
import { NextFunction, Request, Response } from "express";
import { MagicLinkTokenPayload } from "../utils/jwt";
import { MagicLinkModel } from "@/database/models/magicLinkSession.model";
import { userService } from "@/modules/user/user.module";
import { asyncLocalStorage } from "../context/asyncLocalStorage";

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => {
      // ! 0. Evaluate the existence of token
      const magicLinkToken = req.params?.token;
      if (!magicLinkToken) {
        throw new UnauthorizedException(
          "Authentication failed: no authentication token provided.",
          ErrorCode.AUTH_TOKEN_NOT_FOUND
        );
      }
      return magicLinkToken;
    },
  ]),
  issuer: config.AUTHENTICATION.TOKEN_ISSUER,
  audience: [config.AUTHENTICATION.TOKEN_AUDIENCE],
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
    // ! 01. Evaluate token type
    if (payload.type !== "magic-link") {
      return done(
        new UnauthorizedException(
          "Authentication failed, expected an MAGIC-LINK token, but received a token of a different type.",
          ErrorCode.AUTH_MAGIC_LINK_TOKEN_TYPE_INVALID
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
    const magicLinkSession = await MagicLinkModel.findOne({
      _id: payload.magicLinkSessionId,
      tokenJTI: payload.jti,
      consumed: false,
    });
    if (!magicLinkSession) {
      return done(
        new UnauthorizedException(
          "Authentication failed, the token session is invalid, expired, or has already been consumed.",
          ErrorCode.AUTH_TOKEN_SESSION_INVALID
        ),
        false
      );
    }

    // ! 04. Check if session user = token user
    const isNotUserSession = magicLinkSession.userId !== payload.userId;
    if (isNotUserSession) {
      return done(
        new UnauthorizedException(
          "Authentication failed, the access token does not match the current session.",
          ErrorCode.AUTH_TOKEN_SESSION_MISMATCH
        )
      );
    }
    // ! 05. Mark magic-link session as consumed
    magicLinkSession.consumed = true;
    await magicLinkSession.save();

    done(null, user);
  } catch (err) {
    done(err, false);
  }
};

const magicLinkStrategy = new JwtStrategy(options, verifyCallback);

export const setupMagicLinkStrategy = (passport: PassportStatic) => {
  passport.use("magic-link-token", magicLinkStrategy);
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
