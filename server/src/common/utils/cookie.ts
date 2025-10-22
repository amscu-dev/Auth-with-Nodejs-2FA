import { config } from "@/config/app.config";
import { CookieOptions, Response } from "express";
import { calculateExpirationDate } from "./date-time";
import ms from "ms";

interface CookiePayloadType {
  res: Response;
  accessToken: string;
  refreshToken: string;
}

interface MFACookiePayloadType {
  res: Response;
  mfaToken: string;
}

export const REFRESH_PATH = `${config.BASE_PATH}/auth/refresh`;
export const MFA_PATH = `${config.BASE_PATH}/mfa`;

const defaults: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production" ? true : false,
  sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
};

export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.REFRESH_EXPIRES_IN as ms.StringValue;
  const expires = calculateExpirationDate(expiresIn);
  return {
    ...defaults,
    expires,
    path: REFRESH_PATH,
  };
};
export const getAccessTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.EXPIRES_IN as ms.StringValue;
  const expires = calculateExpirationDate(expiresIn);
  return {
    ...defaults,
    expires,
    path: "/",
  };
};

export const getMFATokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.MFA_TOKEN.EXPIRES_IN as ms.StringValue;
  const expires = calculateExpirationDate(expiresIn);
  return {
    ...defaults,
    expires,
    path: MFA_PATH,
  };
};

export const setMFATokenCookie = ({
  res,
  mfaToken,
}: MFACookiePayloadType): Response =>
  res.cookie("mfaToken", mfaToken, getMFATokenCookieOptions());

export const setAuthenticationCookies = ({
  res,
  accessToken,
  refreshToken,
}: CookiePayloadType): Response =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthenticationCookies = (res: Response): Response =>
  res.clearCookie("accessToken").clearCookie("refreshToken", {
    path: REFRESH_PATH,
  });
