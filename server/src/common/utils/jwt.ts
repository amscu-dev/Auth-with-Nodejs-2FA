import { config } from "@/config/app.config";
import { SessionDocument } from "@/database/models/session.model";
import { UserDocument } from "@/database/models/user.model";
import jwt from "jsonwebtoken";
import decodeBase64 from "./decodeBase64";

// ! These are added by default by jwt library based on options provided

export interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  userId: UserDocument["_id"];
  sessionId: SessionDocument["_id"];
}

export interface RefreshTokenPayload extends jwt.JwtPayload {
  sessionId: SessionDocument["_id"];
}

export interface MFATokenPayload extends jwt.JwtPayload {
  sub: string;
  userId: UserDocument["_id"];
  loginAttemptId: string;
  type: "mfa";
}

export type SignOptsAndSecret = jwt.SignOptions & {
  secret: jwt.Secret | jwt.PrivateKey;
};

const defaults: jwt.SignOptions = {
  audience: ["user"],
  algorithm: "RS256",
  issuer: config.APP_NAME,
};

export const accessTokenSignOptions: SignOptsAndSecret = {
  expiresIn: config.JWT.EXPIRES_IN || "15m",
  secret: decodeBase64(config.JWT.PRIVATE_KEY),
};
export const refreshTokenSignOptions: SignOptsAndSecret = {
  expiresIn: config.JWT.REFRESH_EXPIRES_IN || "30d",
  secret: decodeBase64(config.JWT.REFRESH_PRIVATE_KEY),
};

export const mfaTokenOptions: SignOptsAndSecret = {
  expiresIn: config.MFA_TOKEN.EXPIRES_IN || "5m",
  secret: config.MFA_TOKEN.SECRET_KEY,
};

export const signJwtToken = (
  payload: AccessTokenPayload | RefreshTokenPayload | MFATokenPayload,
  options: SignOptsAndSecret
) => {
  const { secret, ...opts } = options;
  return jwt.sign(payload, secret, {
    ...defaults,
    ...opts,
  });
};

const verifyDefaults: jwt.VerifyOptions = {
  audience: ["user"],
  algorithms: ["RS256"],
  issuer: config.APP_NAME,
};

// ! FUNCTION OVERLOAD
export function verifyJwt(
  token: string,
  keyType: "ACCESS_TOKEN"
): AccessTokenPayload | undefined;
export function verifyJwt(
  token: string,
  keyType: "REFRESH_TOKEN"
): RefreshTokenPayload | undefined;

export function verifyJwt(
  token: string,
  tokenType: "ACCESS_TOKEN" | "REFRESH_TOKEN"
): AccessTokenPayload | RefreshTokenPayload | undefined {
  const publicKey =
    tokenType === "ACCESS_TOKEN"
      ? decodeBase64(config.JWT.PUBLIC_KEY)
      : decodeBase64(config.JWT.REFRESH_PUBLIC_KEY);

  try {
    const payload = jwt.verify(token, publicKey, {
      ...verifyDefaults,
    });
    return payload as AccessTokenPayload | RefreshTokenPayload;
  } catch (err: any) {
    console.log(err);
    return undefined;
  }
}
