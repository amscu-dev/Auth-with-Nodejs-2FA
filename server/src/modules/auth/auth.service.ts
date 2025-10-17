import ms from "ms";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { VerficationEnum } from "@/common/enums/verification-code.enum";
import { LoginData, RegisterData } from "@/common/interface/auth.interface";
import { BadRequestException } from "@/common/utils/catch-errors";
import { fortyFiveMinutesFromNow } from "@/common/utils/date-time";
import { config } from "@/config/app.config";
import SessionModel from "@/database/models/session.model";
import UserModel from "@/database/models/user.model";
import VerificationCodeModel from "@/database/models/verification.model";
import jwt from "jsonwebtoken";
import decodeBase64 from "@/common/utils/decodeBase64";
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
        "Invalid email or password provided",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new BadRequestException(
        "Invalid email or password provided",
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
    const accessToken = jwt.sign(
      {
        userId: user._id,
        sessionId: session._id,
      },
      decodeBase64(config.JWT.PRIVATE_KEY),
      {
        algorithm: "RS256",
        expiresIn: config.JWT.EXPIRES_IN as ms.StringValue,
        audience: ["user"],
      }
    );
    const refreshToken = jwt.sign(
      {
        sessionId: session._id,
      },
      decodeBase64(config.JWT.REFRESH_PRIVATE_KEY),
      {
        algorithm: "RS256",
        expiresIn: config.JWT.REFRESH_EXPIRES_IN as ms.StringValue,
        audience: ["user"],
      }
    );

    return { user, accessToken, refreshToken, mfaRequired: false };
  }
}
