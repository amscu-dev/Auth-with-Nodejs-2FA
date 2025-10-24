import useragent from "express-useragent";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { GoogleAuthResponse } from "@/common/interface/oidc.interface";
import {
  AuthenticationException,
  BadRequestException,
  NotFoundException,
} from "@/common/utils/catch-errors";
import { fiveMinutesFromNow } from "@/common/utils/date-time";
import { generatePKCEChallenge } from "@/common/utils/generatePKCEChallenge";
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
  signJwtToken,
} from "@/common/utils/jwt";
import {
  getGoogleAuthorizationURL,
  getGoogleTokenEndpointURL,
  GoogleIDTokenPayload,
  JWKS_GOOGLE,
  verifyOAuthIDToken,
} from "@/common/utils/oauth";
import { generateUniqueCode } from "@/common/utils/uuid";
import { config } from "@/config/app.config";
import { OIDCSessionModel } from "@/database/models/oidc-session.model";
import SessionModel from "@/database/models/session.model";
import UserModel from "@/database/models/user.model";
import axios from "axios";
import { Request } from "express";

export class OIDCSessionService {
  public async creteOIDCSession() {
    // ! Generate a random state
    const state = generateUniqueCode();
    // ! Generate code_verifier and code_challenge
    const { codeChallenge, codeVerifier } = generatePKCEChallenge();
    // ! Create OIDC Session
    await OIDCSessionModel.create({
      state,
      codeChallenge,
      codeVerifier,
      OIDCProvider: "google",
      expiresAt: fiveMinutesFromNow(),
    });
    // ! Generate GoogleAuthURL
    const url = getGoogleAuthorizationURL({ state, codeChallenge });
    return url;
  }
  public async authenticateUser(code: string, state: string, req: Request) {
    // ! Lookup in DB for state, in order to indetify request
    const session = await OIDCSessionModel.findOneAndUpdate(
      {
        state,
      },
      {
        consumed: true,
      },
      {
        returnDocument: "before",
      }
    );
    if (!session) {
      throw new NotFoundException(
        "OIDC Session not found.",
        ErrorCode.OIDC_MISSING_SESSION
      );
    }

    if (session.consumed) {
      throw new BadRequestException(
        "OIDC Session already consumed.",
        ErrorCode.OIDC_EXPIRED_SESSION
      );
    }
    const { TOKEN_ENDPOINT_BASE_URL, queryParams } = getGoogleTokenEndpointURL({
      code,
      codeVerifier: session.codeVerifier,
    });
    try {
      const { data } = await axios.post<GoogleAuthResponse>(
        TOKEN_ENDPOINT_BASE_URL,
        queryParams.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      const idtoken = data.id_token;
      // ! Validate Token
      const { payload, protectedHeader } =
        await verifyOAuthIDToken<GoogleIDTokenPayload>({
          jwks: JWKS_GOOGLE,
          jwt: idtoken,
          audience: config.GOOGLE_OAUTH_CLIENT_ID,
          issuer: ["https://accounts.google.com", "accounts.google.com"],
        });
      // ! Find User in DB
      const user = await UserModel.findOneAndUpdate(
        {
          email: payload.email,
        },
        {
          $setOnInsert: {
            name: payload.name,
            email: payload.email,
            password: generateUniqueCode(),
            isEmailVerified: true,
            userPreferences: {
              enable2FA: false,
              emailNotification: true,
              registerMethod: "oidc",
              supportedAuthMethods: ["regular"],
            },
          },
        },
        { new: true, upsert: true }
      );
      // ! Parse UA Agent
      const uaSource = req.headers["user-agent"];
      const parsedUA = useragent.parse(uaSource ?? "unknown");
      // ! CREATE SESSION
      const session = await SessionModel.create({
        userId: user._id,
        userAgent: {
          browser: parsedUA.browser || "unknown",
          version: parsedUA.version || "unknown",
          os: parsedUA.os || "unknown",
          platform: parsedUA.platform || "unknown",
        },
      });

      // ! CREATE TOKENS
      const accessToken = signJwtToken(
        {
          userId: user._id,
          sessionId: session._id,
        },
        { ...accessTokenSignOptions }
      );

      const refreshToken = signJwtToken(
        {
          sessionId: session._id,
        },
        { ...refreshTokenSignOptions }
      );

      return {
        user,
        accessToken,
        refreshToken,
        mfaRequired: false,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new AuthenticationException(
          "Failed to authenticate with Google OAuth",
          ErrorCode.OIDC_FAILED_AUTHENTIFICATION
        );
      } else {
        throw error;
      }
    }
  }
}
