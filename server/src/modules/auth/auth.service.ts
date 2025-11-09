import useragent from "express-useragent";
import geoip from "geoip-lite";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { VerificationEnum } from "@/common/enums/verification-code.enum";
import { LoginData, RegisterData } from "@/common/interface/auth.interface";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavaibleException,
  TooManyRequestsException,
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
} from "@/common/utils/jwt";
import { sendEmail } from "@/mailers/mailer";
import {
  passwordResetSuccessTemplate,
  passwordResetTemplate,
  verifyEmailTemplate,
} from "@/mailers/templates/template";
import mongoose from "mongoose";
import apiRequestWithRetry from "@/common/utils/retry-api";
import { Location } from "@/database/models/resetPasswordLog.model";
import logPasswordReset from "@/common/utils/logPasswordReset";
import { generateUniqueCode } from "@/common/utils/uuid";
import { MFASessionModel } from "@/database/models/mfaSession.model";
import { Request } from "express";

export class AuthService {
  public async register(registerData: RegisterData) {
    // ! 01. Extract Data
    const { name, email, password } = registerData;

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

    // ! 03. Create And Execute Transaction
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

      // ! 04. Send Verification Code Email
      const verificationURL = `${config.FRONTEND_ORIGIN}/accounts/confirm-email?code=${verificationCode.code}&email=${email}`;
      const isVerificationEmailSend = await apiRequestWithRetry(() => {
        return sendEmail({
          to: newUser.email,
          ...verifyEmailTemplate(verificationURL),
        });
      });

      const userJson = newUser.toJSON();
      // ! 05. Return data
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
    // ! 02. Return boolean value
    if (user.isEmailVerified) return true;
    return false;
  }
  public async login(loginData: LoginData, uaSource: string, ip: string) {
    // ! 01. Extract data
    const { email, password } = loginData;

    // ! 02. Check user existance
    const user = await UserModel.findOne({
      email,
    });
    if (!user) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    const supportsRegular =
      user.userPreferences?.supportedAuthMethods?.includes("regular");

    if (!supportsRegular) {
      throw new ForbiddenException(
        "You do not have permission to perform this action. To benefit of 2FA, please add a password-based login method in your account settings first. (choose forgot password)",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }
    // ! 03. Check password match
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new BadRequestException(
        "Invalid credentials. Please check your email and password and try again.",
        ErrorCode.AUTH_INVALID_CREDENTIALS
      );
    }

    // ! 04. If password match, start authentication process:

    const parsedUA = useragent.parse(uaSource ?? "unknown");

    // ! 05. Check if user has MFA enabled
    if (user.userPreferences.enable2FA) {
      // ! 05.1. Generate a MFA session, and send an associated cookie token
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

    // ! 06. If user, does not have MFA enabled, start registration process:
    const session = await SessionModel.create({
      userId: user._id,
      userAgent: {
        browser: parsedUA.browser || "unknown",
        version: parsedUA.version || "unknown",
        os: parsedUA.os || "unknown",
        platform: parsedUA.platform || "unknown",
      },
    });
    const accessToken = signJwtToken(
      {
        sub: user.id,
        userId: user.id,
        sessionId: session.id,
        type: "access",
        role: "user",
      },
      { ...accessTokenSignOptions }
    );
    const refreshToken = signJwtToken(
      {
        sub: user.id,
        userId: user.id,
        sessionId: session.id,
        type: "refresh",
      },
      { ...refreshTokenSignOptions }
    );

    // ! 07. Return data
    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
      mfaToken: "",
    };
  }
  public async verifyEmail(code: string) {
    // ! 01. Check for validation code existance & integrity
    const validCode = await VerificationCodeModel.findOne({
      code: code,
      type: VerificationEnum.EMAIL_VERIFICATION,
    });
    if (!validCode) {
      throw new NotFoundException(
        "Invalid or non-existent verification code. Please request a new one.",
        ErrorCode.VERIFICATION_CODE_ERROR_CODE_NOT_FOUND
      );
    }
    if (validCode.expiresAt < new Date()) {
      throw new BadRequestException(
        "This verification code has expired. Please request a new one to continue.",
        ErrorCode.VERIFICATION_CODE_ERROR_CODE_EXPIRED
      );
    }
    if (validCode.used) {
      throw new BadRequestException(
        "This verification code has already been used. Please request a new one if needed.",
        ErrorCode.VERIFICATION_CODE_ERROR_CODE_CONSUMED
      );
    }

    // ! 02. If code verification passed, verify user email
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
          throw new NotFoundException(
            "User with the specified email was not found.",
            ErrorCode.AUTH_USER_NOT_FOUND
          );
        }
        validCode.used = true;
        await validCode.save({ session: mongoSession });
        return updatedUser;
      });
      // ! 03. Return data
      return { user: updatedUser };
    } catch (error) {
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  }
  public async resendEmail(email: string) {
    // ! 01. Check if email exists
    const user = await UserModel.findOne({
      email,
    });
    // ! 02. If not send error
    if (!user) {
      throw new NotFoundException(
        "Specified email was not found in database. Please register your account.",
        ErrorCode.AUTH_EMAIL_NOT_FOUND
      );
    }
    if (user.isEmailVerified) {
      throw new ConflictException(
        "This email address is already verified. Please proceed to login.",
        ErrorCode.AUTH_EMAIL_ALREADY_VERIFIED
      );
    }
    // ! 03. Create new verification code
    const verificationCode = new VerificationCodeModel({
      userId: user._id,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    });
    await verificationCode.save();
    // ! 04. Send Verification Code Email
    const verificationURL = `${config.FRONTEND_ORIGIN}/accounts/confirm-email?code=${verificationCode.code}&email=${email}`;
    const isEmailSuccessfullySend = await apiRequestWithRetry(() => {
      return sendEmail({
        to: user.email,
        ...verifyEmailTemplate(verificationURL),
      });
    });
    if (!isEmailSuccessfullySend) {
      throw new ServiceUnavaibleException(
        "Failed to send the email. Please try again later.",
        ErrorCode.EMAIL_SERVICE_ERROR
      );
    }
    return {
      email,
      isEmailSuccessfullySend,
    };
  }
  public async checkEmail(email: string) {
    const userid = await UserModel.exists({ email });
    if (!userid) {
      return {
        isNewEmail: true,
      };
    }
    return {
      isNewEmail: false,
    };
  }
  public async forgotPassword(email: string, ip: string) {
    // ! 01. Check for user existance
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // ! 02. Check mail rate limit is 2 per 3 minutes interval
    const timeAgo = threeMinutesAgo();
    const maxAttempts = 2;
    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      createdAt: { $gt: timeAgo },
    });
    if (count >= maxAttempts) {
      throw new TooManyRequestsException();
    }

    // ! 03. Check if user has MFA enabled
    if (user.userPreferences.enable2FA) {
      // ! 03.1. Generate a MFA session, and send an associated cookie token
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

    // ! 04. If user does not have MFA, create new validation code in db
    const expiresAt = anHourFromNow();
    const validCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    });

    // ! 05. Send email with newly verification code created
    const resetLink = `${config.FRONTEND_ORIGIN}/accounts/reset-password?code=${
      validCode.code
    }&exp=${expiresAt.getTime()}`;
    const isResetPasswordEmailSend = await apiRequestWithRetry(() =>
      sendEmail({
        to: user.email,
        ...passwordResetTemplate(resetLink),
      })
    );
    // ! 05.1 In case of an external service error
    if (!isResetPasswordEmailSend) {
      throw new ServiceUnavaibleException(
        "Failed to send the email. Please try again later.",
        ErrorCode.EMAIL_SERVICE_ERROR
      );
    }
    // ! 06. Return data
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
    // ! 01. Check verification code existence and integrity
    const validCode = await VerificationCodeModel.findOne({
      code: verificationCode,
      type: VerificationEnum.PASSWORD_RESET,
    });

    // ! * Indenity IP Address
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
      throw new NotFoundException(
        "Invalid or non-existent verification code. Please request a new one.",
        ErrorCode.VERIFICATION_CODE_ERROR_CODE_NOT_FOUND
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
      if (validCode.used) {
        throw new BadRequestException(
          "This verification code has already been used. Please request a new one if needed.",
          ErrorCode.VERIFICATION_CODE_ERROR_CODE_CONSUMED
        );
      }
    }
    if (validCode.expiresAt < new Date()) {
      await logPasswordReset({
        userId: validCode.userId,
        ip,
        userAgent,
        status: "failed",
        reason: "Expired verification code.",
        location,
      });
      if (validCode.expiresAt < new Date()) {
        throw new BadRequestException(
          "This verification code has expired. Please request a new one to continue.",
          ErrorCode.VERIFICATION_CODE_ERROR_CODE_EXPIRED
        );
      }
    }

    // ! 02. Check user existance
    const currentUser = await UserModel.findById(validCode.userId);
    if (!currentUser) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // ! 03. Check new password validity
    const isNewPasswordValid = await currentUser.validateNewPassword(password);
    if (!isNewPasswordValid) {
      await logPasswordReset({
        userId: validCode.userId,
        ip,
        userAgent,
        status: "failed",
        reason:
          "You cannot reuse a previous password. Please choose a new one.",
        location,
      });
      throw new BadRequestException(
        "You cannot reuse an old password.",
        ErrorCode.AUTH_PASSWORD_REUSE_NOT_ALLOWED
      );
    }

    // ! 04. Initialize a Mongo Session for mark code as used, register new password created in db, and update the user
    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        // ! 04.1. Add current password to old passwords
        currentUser.oldPassword.unshift(currentUser.password);
        currentUser.password = password;
        // ! 04.2 Now we are sure that user set password, so we can add a new authentication method.
        if (
          !currentUser.userPreferences.supportedAuthMethods.includes("regular")
        ) {
          currentUser.userPreferences.supportedAuthMethods.push("regular");
        }
        // ! 04.3 Save user and mark code as used
        await currentUser.save({ session: mongoSession });
        validCode.used = true;
        await validCode.save({ session: mongoSession });

        // ! 04.4 Delete all user sessions
        await SessionModel.deleteMany(
          {
            userId: currentUser._id,
          },
          { session: mongoSession }
        );

        // ! 04.5 Create a new password log
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
      //  ! 04.6 Sent email for confirmed password change
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
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  }
  public async refreshToken(req: Request) {
    // ! 01. Get session & user from request (attached in passport middleware)
    const sessionId = req.sessionId;
    const user = req.user as Express.User;
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new UnauthorizedException(
        "Authentication failed, the refresh token session does not exist or is invalid. Please log in again.",
        ErrorCode.AUTH_REFRESH_TOKEN_SESSION_INVALID
      );
    }

    // ! 02. Check if session & refresh token need refresh of period
    const now = Date.now();
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
            sub: user.id,
            userId: user.id,
            sessionId: session.id,
            type: "refresh",
          },
          { ...refreshTokenSignOptions }
        )
      : undefined;

    // ! 03. Sign new access token
    const accessToken = signJwtToken(
      {
        sub: user.id,
        userId: session.userId.toString(),
        sessionId: session.id,
        type: "access",
        role: "user",
      },
      { ...accessTokenSignOptions }
    );

    // ! 04. Return tokens
    return { newRefreshToken, accessToken };
  }
  public async logout(sessionId: string) {
    // ! 01. Existence of Current Session is already verified in JWT Strategy Middleware
    return await SessionModel.findByIdAndDelete(sessionId);
  }
}
