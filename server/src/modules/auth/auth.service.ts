import ms from "ms";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { VerficationEnum } from "@/common/enums/verification-code.enum";
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
import jwt from "jsonwebtoken";
import decodeBase64 from "@/common/utils/decodeBase64";
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
  signJwtToken,
  verifyJwt,
} from "@/common/utils/jwt";
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

    const newUser = await UserModel.create({
      name,
      email,
      password,
    });

    const userId = newUser._id;

    const verificationCode = await VerificationCodeModel.create({
      userId,
      type: VerficationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    });
    // * TODO: Sending verification email link

    return {
      user: newUser,
    };
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

    // * Check if the user enabled 2FA return user=null
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
}
