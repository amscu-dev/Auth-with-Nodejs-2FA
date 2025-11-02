import { config } from "@/config/app.config";
import jwt from "jsonwebtoken";
import decodeBase64 from "./decodeBase64";

export interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  userId: string;
  sessionId: string;
  type: "access";
  role: "user" | "admin";
}

export interface RefreshTokenPayload extends jwt.JwtPayload {
  sub: string;
  userId: string;
  sessionId: string;
  type: "refresh";
}
export interface MFATokenPayload extends jwt.JwtPayload {
  jti: string;
  sub: string;
  userId: string;
  mfaSessionId: string;
  type: "mfa";
  purpose: "login" | "forgot_password";
}

export interface MagicLinkTokenPayload extends jwt.JwtPayload {
  jti: string;
  sub: string;
  userId: string;
  magicLinkSessionId: string;
  type: "magic-link";
  purpose: "signin" | "signup";
}

export type SignOptsAndSecret = jwt.SignOptions & {
  secret: jwt.Secret | jwt.PrivateKey;
};

const defaults: jwt.SignOptions = {
  audience: [config.AUTHENTICATION.TOKEN_AUDIENCE],
  issuer: config.AUTHENTICATION.TOKEN_ISSUER,
  algorithm: "RS256",
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

export const magicLinkTokenOptions: SignOptsAndSecret = {
  expiresIn: config.MAGIC_LINK_TOKEN.EXPIRES_IN || "5m",
  secret: config.MAGIC_LINK_TOKEN.SECRET_KEY,
};

export const signJwtToken = (
  payload:
    | AccessTokenPayload
    | RefreshTokenPayload
    | MFATokenPayload
    | MagicLinkTokenPayload,
  options: SignOptsAndSecret
) => {
  const { secret, ...opts } = options;
  return jwt.sign(payload, secret, {
    ...defaults,
    ...opts,
  });
};

const verifyDefaults: jwt.VerifyOptions = {
  audience: [config.AUTHENTICATION.TOKEN_AUDIENCE],
  algorithms: ["RS256"],
  issuer: config.AUTHENTICATION.TOKEN_ISSUER,
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
