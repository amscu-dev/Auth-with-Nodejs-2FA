import useragent from "express-useragent";
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
  ServiceUnavaibleException,
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
import { config } from "@/config/app.config";
import { getInfoFromAsyncLocalStorage } from "@/common/context/asyncLocalStorage";

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
    const magicLink = `${config.FRONTEND_ORIGIN}/accounts/magic/authenticate/${magicToken}`;

    const isMagicLinkEmailSend = await apiRequestWithRetry(() => {
      return sendEmail({
        to: email,
        ...magicLinkEmailTemplate(magicLink),
      });
    });
    if (!isMagicLinkEmailSend) {
      throw new ServiceUnavaibleException(
        "Failed to send the email. Please try again later.",
        ErrorCode.EMAIL_SERVICE_ERROR
      );
    }
    return isMagicLinkEmailSend;
  }
  public async signInWithMagicLink(email: string) {
    // ! 01. Check user existance
    const user = await UserModel.findOne({
      email,
    });
    if (!user) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    // ! 02. Initiate magic link session
    const isMagicLinkEmailSend = await this.createMagicLinkSession(
      email,
      user.id,
      "signin"
    );

    // ! 03. Return confirmation that link is sent
    return isMagicLinkEmailSend;
  }
  public async signUpWithMagicLink(registerData: MagicLinkRegisterData) {
    // ! 01. Extract Data
    const { email, name } = registerData;
    // ! 02. Check user existence
    const existingUser = await UserModel.exists({
      email,
    });
    if (existingUser) {
      throw new BadRequestException(
        "Registration failed, this email address is already associated with an existing account.",
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }
    // ! 03. Create new user in db
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
    // ! 04. Create MagicLink
    const isMagicLinkEmailSend = await this.createMagicLinkSession(
      email,
      user.id,
      "signup"
    );

    // ! 05. Return User
    return { isMagicLinkEmailSend, user };
  }
  public async resendMagicLink(email: string) {
    // ! 01. Check user existance
    const user = await UserModel.findOne({
      email,
    });
    if (!user) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // ! 02. Create magic link session
    const isMagicLinkEmailSend = await this.createMagicLinkSession(
      email,
      user.id,
      "signin"
    );

    // ! 03. Return confirmation of email sent
    return isMagicLinkEmailSend;
  }
  public async authenticateUser(req: Request) {
    // ! 01. We extract user from req, we already proved existance in passport middleware
    const user = req.user as Express.User;
    const { reqUserAgent } = getInfoFromAsyncLocalStorage();
    // ! 02. Create session & authenticate user
    const mongoSession = await mongoose.startSession();
    try {
      const { sessionAuth } = await mongoSession.withTransaction(async () => {
        // ! 02.2 Create Session
        const sessionAuth = new SessionModel({
          userId: user._id,
          userAgent: reqUserAgent,
        });
        if (!user.isEmailVerified) {
          user.isEmailVerified = true;
          await user.save({ session: mongoSession });
        }
        await sessionAuth.save({ session: mongoSession });
        return { sessionAuth };
      });
      // ! 02.3 Create tokens
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
      // ! 03. Return credentials
      return {
        user,
        accessToken,
        refreshToken,
        mfaRequired: false,
      };
    } catch (error) {
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  }
}
