import useragent from "express-useragent";
import {
  InternalServerException,
  NotFoundException,
} from "@/common/utils/catch-errors";
import {
  accessTokenSignOptions,
  magicLinkTokenOptions,
  refreshTokenSignOptions,
  signJwtToken,
} from "@/common/utils/jwt";
import apiRequestWithRetry from "@/common/utils/retry-api";
import { generateUniqueCode } from "@/common/utils/uuid";
import { MagicLinkModel } from "@/database/models/magicLinkSession.model";
import { sendEmail } from "@/mailers/mailer";
import { magicLinkEmailTemplate } from "@/mailers/templates/template";
import { Request } from "express";
import UserModel from "@/database/models/user.model";
import SessionModel from "@/database/models/session.model";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { MagicLinkRegisterData } from "@/common/interface/magic-link.interface";
import mongoose from "mongoose";

export class MagicLinkService {
  public async createMagicLinkSession(
    email: string,
    userId: string,
    sessionPurpose: "signin" | "signup"
  ) {
    const tokenId = generateUniqueCode();
    const magicLinkSession = await MagicLinkModel.create({
      tokenJTI: tokenId,
      userId,
      sessionPurpose,
    });
    const magicToken = signJwtToken(
      {
        jti: tokenId,
        sub: userId,
        userId,
        magicLinkSessionId: magicLinkSession.id,
        type: "magic-link",
        purpose: sessionPurpose,
      },
      { ...magicLinkTokenOptions, algorithm: "HS256" }
    );
    // * TODO : Modificare hardcodare link
    const magicLink = `http://localhost:8000/api/v1/magic-link/verify/${magicToken}`;

    const isMagicLinkEmailSend = await apiRequestWithRetry(() => {
      return sendEmail({
        to: email,
        ...magicLinkEmailTemplate(magicLink),
      });
    });
    if (!isMagicLinkEmailSend) {
      throw new InternalServerException();
    }
    return isMagicLinkEmailSend;
  }
  public async signInWithMagicLink(email: string) {
    const user = await UserModel.findOne({
      email,
    });
    if (!user) {
      throw new NotFoundException(
        "There is no user registered with this email address.",
        ErrorCode.AUTH_NOT_FOUND
      );
    }
    const isMagicLinkEmailSend = await this.createMagicLinkSession(
      email,
      user.id,
      "signin"
    );
    return isMagicLinkEmailSend;
  }
  public async signUpWithMagicLink(registerData: MagicLinkRegisterData) {
    const { email, name } = registerData;
    const user = await UserModel.create({
      name: name,
      email: email,
      password: generateUniqueCode(),
      isEmailVerified: false,
      userPreferences: {
        enable2FA: false,
        emailNotification: true,
        registerMethod: "magic-link",
        supportedAuthMethods: ["magic-link"],
      },
    });
    const isMagicLinkEmailSend = await this.createMagicLinkSession(
      email,
      user.id,
      "signup"
    );
    return { isMagicLinkEmailSend, user };
  }
  public async authenticateUser(req: Request) {
    // ! We already verified user existance in
    const user = req.user as Express.User;
    const mongoSession = await mongoose.startSession();
    try {
      const { sessionAuth } = await mongoSession.withTransaction(async () => {
        // ! Parse UA Agent
        const uaSource = req.headers["user-agent"];
        const parsedUA = useragent.parse(uaSource ?? "unknown");
        // ! CREATE SESSION

        const sessionAuth = new SessionModel({
          userId: user._id,
          userAgent: {
            browser: parsedUA.browser || "unknown",
            version: parsedUA.version || "unknown",
            os: parsedUA.os || "unknown",
            platform: parsedUA.platform || "unknown",
          },
        });
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          await user.save({ session: mongoSession });
        }
        await sessionAuth.save({ session: mongoSession });
        return { sessionAuth };
      });
      // ! CREATE TOKENS
      const accessToken = signJwtToken(
        {
          sub: user.id,
          userId: user.id,
          sessionId: sessionAuth.id,
          type: "access",
          role: "user",
        },
        { ...accessTokenSignOptions }
      );

      const refreshToken = signJwtToken(
        {
          sub: user.id,
          userId: user.id,
          sessionId: sessionAuth.id,
          type: "refresh",
        },
        { ...refreshTokenSignOptions }
      );

      return {
        user,
        accessToken,
        refreshToken,
        mfaRequired: false,
      };
    } catch (error) {
      throw error;
    } finally {
      mongoSession.endSession();
    }
  }
  public async resendMagicLink(email: string) {
    const user = await UserModel.findOne({
      email,
    });
    if (!user) {
      throw new NotFoundException(
        "There is no user registered with this email address.",
        ErrorCode.AUTH_NOT_FOUND
      );
    }
    const isMagicLinkEmailSend = await this.createMagicLinkSession(
      email,
      user.id,
      "signin"
    );
    return isMagicLinkEmailSend;
  }
}
