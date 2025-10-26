import useragent from "express-useragent";
import { ErrorCode } from "@/common/enums/error-code.enum";
import {
  GithubAuthResponse,
  GitHubEmailResponse,
  GitHubUserProfile,
  GoogleAuthResponse,
} from "@/common/interface/oidc.interface";
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
  getGithubTokenEndpointURL,
  getGithubUserEndpointURL,
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
  private async findOIDCSession(
    state: string,
    OIDCProvider: "google" | "github"
  ) {
    const session = await OIDCSessionModel.findOne({
      state,
      OIDCProvider,
    });
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
    return session;
  }
  private async findOrCreateUser({
    email,
    name,
    req,
  }: {
    email: string;
    name: string;
    req: Request;
  }) {
    // ! Find User in DB
    const user = await UserModel.findOneAndUpdate(
      {
        email: email,
      },
      {
        $setOnInsert: {
          name: name,
          email: email,
          password: generateUniqueCode(),
          isEmailVerified: true,
          userPreferences: {
            enable2FA: false,
            emailNotification: true,
            registerMethod: "oidc",
            supportedAuthMethods: ["oidc"],
          },
        },
      },
      { new: true, upsert: true }
    );
    // ! Parse UA Agent
    const uaSource = req.headers["user-agent"];
    const parsedUA = useragent.parse(uaSource ?? "unknown");
    // ! CREATE SESSION
    const sessionAuth = await SessionModel.create({
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
        sessionId: sessionAuth._id,
      },
      { ...accessTokenSignOptions }
    );

    const refreshToken = signJwtToken(
      {
        sessionId: sessionAuth._id,
      },
      { ...refreshTokenSignOptions }
    );

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
    };
  }
  public async createOIDCSession(oidcProvider: string) {
    // ! Generate a random state
    const state = generateUniqueCode();
    // ! Generate code_verifier and code_challenge
    const { codeChallenge, codeVerifier } = generatePKCEChallenge();
    // ! Create OIDC Session
    await OIDCSessionModel.create({
      state,
      codeChallenge,
      codeVerifier,
      OIDCProvider: oidcProvider,
      expiresAt: fiveMinutesFromNow(),
    });
    return { state, codeChallenge };
  }
  public async authenticateGoogleUser(
    code: string,
    state: string,
    req: Request
  ) {
    // ! Lookup in DB for state, in order to indetify request
    const session = await this.findOIDCSession(state, "google");

    const { TOKEN_ENDPOINT_BASE_URL, queryParams } = getGoogleTokenEndpointURL({
      code,
      codeVerifier: session.codeVerifier,
    });
    session.consumed = true;
    await session.save();
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
      console.log(data);
      const idtoken = data.id_token;
      // ! Validate Token
      const { payload, protectedHeader } =
        await verifyOAuthIDToken<GoogleIDTokenPayload>({
          jwks: JWKS_GOOGLE,
          jwt: idtoken,
          audience: config.GOOGLE_OAUTH_CLIENT_ID,
          issuer: ["https://accounts.google.com", "accounts.google.com"],
        });
      console.log(payload);
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.findOrCreateUser({
          email: payload.email || "",
          name: payload.name || "",
          req: req,
        });
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
  public async authenticateGithubUser(
    code: string,
    state: string,
    req: Request
  ) {
    // ! Lookup in DB for state, in order to indetify request
    const session = await this.findOIDCSession(state, "github");
    const { TOKEN_ENDPOINT_BASE_URL, queryParams } = getGithubTokenEndpointURL({
      code,
      codeVerifier: session.codeVerifier,
    });
    session.consumed = true;
    await session.save();
    try {
      const { data } = await axios.post<GithubAuthResponse>(
        TOKEN_ENDPOINT_BASE_URL,
        queryParams.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        }
      );
      console.log(data);

      const [userData, userEmailData] = await Promise.all([
        axios
          .get<GitHubUserProfile>(getGithubUserEndpointURL(), {
            headers: { Authorization: `Bearer ${data.access_token}` },
          })
          .then((res) => res.data),

        axios
          .get<GitHubEmailResponse>("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
              Accept: "application/vnd.github+json",
            },
          })
          .then((res) => res.data),
      ]);
      console.log(userData, userEmailData);
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.findOrCreateUser({
          email: userData.email || userEmailData[0].email,
          name: userData.name || userData.login,
          req: req,
        });
      return {
        user,
        accessToken,
        refreshToken,
        mfaRequired,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error);
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
