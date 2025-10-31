import useragent from "express-useragent";
import geoip from "geoip-lite";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { VerificationEnum } from "@/common/enums/verification-code.enum";
import { LoginData, RegisterData } from "@/common/interface/auth.interface";
import {
  BadRequestException,
  HttpException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException,
} from "@/common/utils/catch-errors";
import {
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
  threeMinutesAgo,
} from "@/common/utils/date-time";
import { config } from "@/config/app.config";
import SessionModel from "@/database/models/session.model";
import UserModel from "@/database/models/user.model";
import VerificationCodeModel from "@/database/models/verification.model";
import {
  accessTokenSignOptions,
  mfaTokenOptions,
  refreshTokenSignOptions,
  signJwtToken,
  verifyJwt,
} from "@/common/utils/jwt";
import { sendEmail } from "@/mailers/mailer";
import {
  passwordResetSuccessTemplate,
  passwordResetTemplate,
  verifyEmailTemplate,
} from "@/mailers/templates/template";
import mongoose from "mongoose";
import apiRequestWithRetry from "@/common/utils/retry-api";
import { HTTPSTATUS } from "@/config/http.config";
import { Location } from "@/database/models/resetPasswordLog.model";
import logPasswordReset from "@/common/utils/logPasswordReset";
import { generateUniqueCode } from "@/common/utils/uuid";
import { MFASessionModel } from "@/database/models/mfaSession.model";

export class AuthService {
  public async register(registerData: RegisterData) {
    const { name, email, password } = registerData;
    const existingUser = await UserModel.exists({
      email,
    });

    if (existingUser) {
      throw new BadRequestException(
        "User already exists with this email.",
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }

    // ! Create And Execute Transaction
    const session = await mongoose.startSession();
    try {
      const { verificationCode, newUser } = await session.withTransaction(
        async () => {
          const newUser = new UserModel({
            name,
            email,
            password,
          });
          const verificationCode = new VerificationCodeModel({
            userId: newUser._id,
            type: VerificationEnum.EMAIL_VERIFICATION,
            expiresAt: fortyFiveMinutesFromNow(),
          });

          await newUser.save({ session: session });
          await verificationCode.save({ session: session });

          return { verificationCode, newUser };
        }
      );
      // ! SEND EMAIL
      const verificationURL = `${config.APP_ORIGIN}/confirm-account?code=${verificationCode.code}`;
      const isVerificationEmailSend = await apiRequestWithRetry(() => {
        return sendEmail({
          to: newUser.email,
          ...verifyEmailTemplate(verificationURL),
        });
      });
      const userJson = newUser.toJSON();
      return {
        user: userJson,
        isVerificationEmailSend,
      };
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }
  public async confirmSignUp(email: string) {
    const user = await UserModel.findOne({
      email,
    });
    if (!user) {
      throw new BadRequestException(
        "Invalid email or password provided.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    if (user.isEmailVerified) return true;
    return false;
  }
  public async login(loginData: LoginData, ip: string) {
    const { email, password, uaSource } = loginData;
    // ! USER VERIFICATION
    const user = await UserModel.findOne({
      email,
    });

    if (!user) {
      throw new BadRequestException(
        "Invalid email or password provided.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new BadRequestException(
        "Invalid email or password provided.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // parse UA
    const parsedUA = useragent.parse(uaSource ?? "unknown");

    // ! CHECK IF USER HAS MFA ENABLED
    if (user.userPreferences.enable2FA) {
      // ! Send a temp token for recording an auth session

      const tokenId = generateUniqueCode();
      const mfaSession = await MFASessionModel.create({
        tokenJTI: tokenId,
        userId: user._id,
        mfaSessionPurpose: "forgot_password",
        requestIP: ip,
      });

      const mfaToken = signJwtToken(
        {
          sub: user.id,
          jti: tokenId,
          userId: user.id,
          type: "mfa",
          mfaSessionId: mfaSession.id,
          purpose: "login",
        },
        { ...mfaTokenOptions, algorithm: "HS256" }
      );
      return {
        user: null,
        mfaRequired: true,
        mfaToken,
        accessToken: "",
        refreshToken: "",
      };
    }

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
        userId: user.id,
        sessionId: session.id,
      },
      { ...accessTokenSignOptions }
    );

    const refreshToken = signJwtToken(
      {
        sessionId: session.id,
      },
      { ...refreshTokenSignOptions }
    );

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
      mfaToken: "",
    };
  }
  public async refreshToken(refreshToken: string) {
    // ! VALIDATE INTEGRITY OF TOKEN
    const payload = verifyJwt(refreshToken, "REFRESH_TOKEN");
    if (!payload) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    // ! VERIFY INTEGRITY OF SESSION
    const session = await SessionModel.findById(payload.sessionId);
    const now = Date.now();

    if (!session) {
      throw new UnauthorizedException("Session does not exists.");
    }
    if (session.expiredAt.getTime() <= now) {
      // ** TODO DELETE EX SESSION - Maybe we want to keep history of sessions?
      throw new UnauthorizedException("Session expired.");
    }

    const sessionRequireRefresh =
      session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;

    if (sessionRequireRefresh) {
      session.expiredAt = calculateExpirationDate(
        config.JWT.REFRESH_EXPIRES_IN
      );
      await session.save();
    }

    const newRefreshToken = sessionRequireRefresh
      ? signJwtToken(
          {
            sessionId: session.id,
          },
          { ...refreshTokenSignOptions }
        )
      : undefined;

    const accessToken = signJwtToken(
      {
        userId: session.userId.toString(),
        sessionId: session.id,
      },
      { ...accessTokenSignOptions }
    );
    return { newRefreshToken, accessToken };
  }
  public async verifyEmail(code: string) {
    // ! Divide between invalid and expired and delete expired ones.
    const validCode = await VerificationCodeModel.findOne({
      code: code,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });
    if (!validCode) {
      throw new BadRequestException(
        "Invalid verification code.",
        ErrorCode.VERIFICATION_ERROR
      );
    }
    // ! Code its expired throw error and delete code
    if (validCode.expiresAt < new Date()) {
      await validCode.deleteOne();
      throw new BadRequestException(
        "Expired verification code.Please request a new one.",
        ErrorCode.VERIFICATION_ERROR
      );
    }

    // ! If code good: Update User + Delete Verif Code in the same Mongo Session
    const mongoSession = await mongoose.startSession();
    try {
      const updatedUser = await mongoSession.withTransaction(async () => {
        const updatedUser = await UserModel.findByIdAndUpdate(
          validCode.userId,
          {
            isEmailVerified: true,
          },
          { new: true, session: mongoSession }
        );

        if (!updatedUser) {
          throw new BadRequestException(
            "Unable to verify email address",
            ErrorCode.VALIDATION_ERROR
          );
        }
        await validCode.deleteOne({ session: mongoSession });

        return updatedUser;
      });
      return { user: updatedUser };
    } catch (error) {
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  }
  public async forgotPassword(email: string, ip: string) {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new NotFoundException(
        "User not found",
        ErrorCode.RESOURCE_NOT_FOUND
      );
    }

    // ! check mail rate limit is 2 per 3 minutes interval

    const timeAgo = threeMinutesAgo();
    const maxAttempts = 2;

    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      createdAt: { $gt: timeAgo },
    });

    if (count >= maxAttempts) {
      throw new HttpException(
        "Too many request,try again later",
        HTTPSTATUS.TOO_MANY_REQUESTS,
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS
      );
    }
    // ! CHECK IF USER HAS MFA ENABLED
    if (user.userPreferences.enable2FA) {
      // ! Send a temp token for recording an auth session

      const tokenId = generateUniqueCode();
      const mfaSession = await MFASessionModel.create({
        tokenJTI: tokenId,
        userId: user._id,
        mfaSessionPurpose: "forgot_password",
        requestIP: ip,
      });
      const mfaToken = signJwtToken(
        {
          sub: user.id,
          jti: tokenId,
          userId: user.id,
          type: "mfa",
          mfaSessionId: mfaSession.id,
          purpose: "forgot_password",
        },
        { ...mfaTokenOptions, algorithm: "HS256" }
      );
      return {
        url: "",
        mfaRequired: true,
        mfaToken,
      };
    }

    // ! Create a new Code
    const expiresAt = anHourFromNow();
    const validCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    });

    // ! Create reset Link
    const resetLink = `${config.APP_ORIGIN}/reset-password?code=${
      validCode.code
    }&exp=${expiresAt.getTime()}`;

    const isResetPasswordEmailSend = await apiRequestWithRetry(() =>
      sendEmail({
        to: user.email,
        ...passwordResetTemplate(resetLink),
      })
    );

    if (!isResetPasswordEmailSend) {
      throw new InternalServerException();
    }

    return {
      url: resetLink,
      mfaRequired: false,
      mfaToken: "",
    };
  }
  public async resetPassword(
    verificationCode: string,
    password: string,
    ip: string | undefined,
    userAgent: string | undefined
  ) {
    const validCode = await VerificationCodeModel.findOne({
      code: verificationCode,
      type: VerificationEnum.PASSWORD_RESET,
    });

    // ! Identify IP Adress
    let location: Location = {
      city: "unknown",
      region: "unknown",
      country: "unknown",
    };
    if (ip) {
      const geo = geoip.lookup(ip);
      location.city = geo?.city || "unknown";
      location.region = geo?.region || "unknown";
      location.country = geo?.country || "unknown";
    }

    if (!validCode) {
      throw new BadRequestException(
        "Invalid verification code.",
        ErrorCode.VERIFICATION_ERROR
      );
    }
    if (validCode.used) {
      await logPasswordReset({
        userId: validCode.userId,
        ip,
        userAgent,
        status: "failed",
        reason: "This verification code has already been used.",
        location,
      });

      throw new BadRequestException(
        "This verification code has already been used.",
        ErrorCode.VERIFICATION_ERROR
      );
    }
    // ! Code its expired throw error and delete code
    if (validCode.expiresAt < new Date()) {
      await logPasswordReset({
        userId: validCode.userId,
        ip,
        userAgent,
        status: "failed",
        reason: "Expired verification code.",
        location,
      });

      throw new BadRequestException(
        "Expired verification code.Please request a new one.",
        ErrorCode.VERIFICATION_ERROR
      );
    }

    // ! Hash New Password, Compare with old password ,Update the new password

    const currentUser = await UserModel.findById(validCode.userId);

    if (!currentUser) {
      throw new NotFoundException(
        "User not found",
        ErrorCode.RESOURCE_NOT_FOUND
      );
    }

    const isNewPasswordValid = await currentUser.validateNewPassword(password);

    if (!isNewPasswordValid) {
      await logPasswordReset({
        userId: validCode.userId,
        ip,
        userAgent,
        status: "failed",
        reason: "User attempted to reuse an old password.",
        location,
      });

      throw new BadRequestException(
        "You cannot reuse an old password.",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // ! Initialize a Mongo Session for mark code as used, register new password created in db, and update the user
    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        // Save Modified User
        currentUser.oldPassword.unshift(currentUser.password);
        // ! Will be hashed in 'save' middleware
        currentUser.password = password;
        if (
          !currentUser.userPreferences.supportedAuthMethods.includes("regular")
        ) {
          currentUser.userPreferences.supportedAuthMethods.push("regular");
        }
        await currentUser.save({ session: mongoSession });

        // Mark curent code as used
        validCode.used = true;
        await validCode.save({ session: mongoSession });

        // Delete all sessions
        await SessionModel.deleteMany(
          {
            userId: currentUser._id,
          },
          { session: mongoSession }
        );

        // Create a new password log
        await logPasswordReset({
          userId: validCode.userId,
          ip,
          userAgent,
          status: "success",
          reason: "User sucessfully reset his password.",
          location,
          session: mongoSession,
        });
      });
      //  ! sent email for confirmed password change
      await apiRequestWithRetry(() => {
        return sendEmail({
          to: currentUser.email,
          ...passwordResetSuccessTemplate(
            ip,
            userAgent,
            location.city,
            location.region,
            location.country
          ),
        });
      });
    } catch (error) {
      throw new InternalServerException(
        "Failed to save user",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    } finally {
      await mongoSession.endSession();
    }
  }
  public async logout(sessionId: string) {
    // ! Existence of Current Session is already verified in JWT Strategy Middleware
    return await SessionModel.findByIdAndDelete(sessionId);
  }
}
