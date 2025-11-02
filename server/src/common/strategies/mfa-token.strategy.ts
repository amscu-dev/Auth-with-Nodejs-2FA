import {
  VerifyCallbackWithRequest,
  ExtractJwt,
  StrategyOptionsWithRequest,
  Strategy as JwtStrategy,
} from "passport-jwt";
import { config } from "@/config/app.config";
import { ErrorCode } from "../enums/error-code.enum";
import { userService } from "@/modules/user/user.module";
import passport, { PassportStatic } from "passport";
import { NextFunction, Request, Response } from "express";
import { MFAPurpose, MFATokenPayload } from "../utils/jwt";
import { MFASessionModel } from "@/database/models/mfaSession.model";
import { asyncLocalStorage } from "../context/asyncLocalStorage";
import { UnauthorizedException } from "../utils/catch-errors";

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => {
      const mfaToken = req.cookies?.mfaToken;
      if (!mfaToken) {
        // goes directly into global error middleware without catchAsync
        throw new UnauthorizedException(
          "Authentication failed, no authentication token provided.",
          ErrorCode.AUTH_TOKEN_NOT_FOUND
        );
      }
      return mfaToken;
    },
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
        new UnauthorizedException(
          "Authentication failed, expected an MFA token, but received a token of a different type.",
          ErrorCode.AUTH_MFA_TOKEN_TYPE_INVALID
        ),
        false
      );
    }

    // ! Check purpose of the token and request path
    const requestPath = req.originalUrl || req.url;
    const pathPurposeMap: Record<string, MFAPurpose> = {
      [`${config.BASE_PATH}/mfa/verify-login`]: "login",
      [`${config.BASE_PATH}/mfa/verify-forgot-password`]: "forgot_password",
    };
    const expectedPurpose = pathPurposeMap[requestPath];

    if (!expectedPurpose) {
      return done(
        new UnauthorizedException(
          "Authentication failed, MFA token was sent to an invalid or unsupported endpoint.",
          ErrorCode.AUTH_MFA_INVALID_ENDPOINT
        ),
        false
      );
    }

    if (payload.purpose !== expectedPurpose) {
      return done(
        new UnauthorizedException(
          `Authentication failed, MFA token purpose mismatch. Expected '${expectedPurpose}', got '${payload.purpose}'.`,
          ErrorCode.AUTH_INVALID_TOKEN_PURPOSE
        ),
        false
      );
    }

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

    const mfaSession = await MFASessionModel.findOne({
      tokenJTI: payload.jti,
      userId: payload.userId,
      consumed: false,
      _id: payload.mfaSessionId,
    });
    if (!mfaSession) {
      return done(
        new UnauthorizedException(
          "Authentication failed, the token session is invalid, expired, or has already been consumed.",
          ErrorCode.AUTH_TOKEN_SESSION_INVALID
        ),
        false
      );
    }

    const isNotUserSession = mfaSession.userId.toString() !== payload.userId;
    if (isNotUserSession) {
      return done(
        new UnauthorizedException(
          "Authentication failed, the user ID in the MFA token does not match the user ID of the session.",
          ErrorCode.AUTH_TOKEN_SESSION_MISMATCH
        )
      );
    }
    mfaSession.consumed = true;
    await mfaSession.save();
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
