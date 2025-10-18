import { ErrorCode } from "@/common/enums/error-code.enum";
import { VerificationEnum } from "@/common/enums/verification-code.enum";
import { LoginData, RegisterData } from "@/common/interface/auth.interface";
import {
  BadRequestException,
  UnauthorizedException,
} from "@/common/utils/catch-errors";
import {
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
} from "@/common/utils/date-time";
import { config } from "@/config/app.config";
import SessionModel from "@/database/models/session.model";
import UserModel from "@/database/models/user.model";
import VerificationCodeModel from "@/database/models/verification.model";
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
  signJwtToken,
  verifyJwt,
} from "@/common/utils/jwt";
import { sendEmail } from "@/mailers/mailer";
import { verifyEmailTemplate } from "@/mailers/templates/template";
import mongoose from "mongoose";
import apiRequestWithRetry from "@/common/utils/retry-api";
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
          const [newUser] = await UserModel.create(
            [
              {
                name,
                email,
                password,
              },
            ],
            { session }
          );

          const userId = newUser._id;

          const [verificationCode] = await VerificationCodeModel.create(
            [
              {
                userId,
                type: VerificationEnum.EMAIL_VERIFICATION,
                expiresAt: fortyFiveMinutesFromNow(),
              },
            ],
            { session }
          );
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
      session.endSession();
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
  public async login(loginData: LoginData) {
    const { email, password, userAgent } = loginData;
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

    // * TODO Check if the user enabled 2FA return user=null
    // ! CREATE SESSION
    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
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

    return { user, accessToken, refreshToken, mfaRequired: false };
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
      // ** TODO DELETE EX SESSION
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
            sessionId: session._id,
          },
          { ...refreshTokenSignOptions }
        )
      : undefined;

    const accessToken = signJwtToken(
      {
        userId: session.userId,
        sessionId: session._id,
      },
      { ...accessTokenSignOptions }
    );
    return { newRefreshToken, accessToken };
  }
  public async verifyEmail(code: string) {
    // * TODO Maybe we divide between invalid and expired
    const validCode = await VerificationCodeModel.findOne({
      code: code,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });
    if (!validCode) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    // ! Update User + Delete Verif Code in the same Mongo Session
    const mongoSession = await mongoose.startSession();
    try {
      const updatedUser = await mongoSession.withTransaction(async () => {
        const updatedUser = await UserModel.findByIdAndUpdate(
          validCode.userId,
          {
            isEmailVerified: true,
          },
          { new: true }
        );

        if (!updatedUser) {
          throw new BadRequestException(
            "Unable to verify email address",
            ErrorCode.VALIDATION_ERROR
          );
        }
        await validCode.deleteOne();

        return updatedUser;
      });
      return { user: updatedUser };
    } catch (error) {
      throw error;
    } finally {
      mongoSession.endSession();
    }
  }
}
