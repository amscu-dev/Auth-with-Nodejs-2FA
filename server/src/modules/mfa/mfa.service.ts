import useragent from "express-useragent";
import { config } from "@/config/app.config";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { Request } from "express";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@/common/utils/catch-errors";
import { ErrorCode } from "@/common/enums/error-code.enum";
import TempTOTPSecretModel from "@/database/models/tempTOTPSecret.model";
import { tenMinutesFromNow } from "@/common/utils/date-time";
import UserModel from "@/database/models/user.model";
import SessionModel from "@/database/models/session.model";
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
  signJwtToken,
} from "@/common/utils/jwt";

export class MfaService {
  public async generateMFASetup(req: Express.Request) {
    // ! Already verified that user exists in JWT middleware so ex can safetly assert it
    const user = req.user as Express.User;

    if (user.userPreferences.enable2FA) {
      throw new ConflictException(
        "Two-factor authentication is already enabled.",
        ErrorCode.MFA_ALREADY_ENABLED
      );
    }

    // ! For Every Request at this endpoint we will regenerate code.

    const secret = speakeasy.generateSecret({ name: config.APP_NAME });
    const secretKey = secret.base32;
    const url = speakeasy.otpauthURL({
      secret: secretKey,
      label: `${user.name}`,
      issuer: config.APP_NAME,
      encoding: "base32",
    });
    const qrImageUrl = await qrcode.toDataURL(url);
    // ! Save a temp secret key, which will turn in a permanent secret key after validation
    await TempTOTPSecretModel.replaceOne(
      {
        userId: user._id,
      },
      {
        userId: user._id,
        secret: secretKey,
        createdAt: new Date(),
        expiredAt: tenMinutesFromNow(),
      },
      { upsert: true }
    );

    return {
      secret: secretKey,
      qrImageUrl,
    };
  }
  public async verifyMFASetup(req: Request, code: string) {
    // ! Already verified that user exists in JWT middleware so ex can safetly assert it
    const user = req.user as Express.User;
    if (user.userPreferences.enable2FA) {
      throw new ConflictException(
        "Two-factor authentication is already enabled.",
        ErrorCode.MFA_ALREADY_ENABLED
      );
    }

    // ! Find Active TempTOTPSecret stored
    const tempSecretDocument = await TempTOTPSecretModel.findOne({
      userId: user._id,
      expiredAt: {
        // ! ALtho we already have a TTL index for cleanup the expired indexes
        $gt: new Date(),
      },
    });

    if (!tempSecretDocument) {
      throw new BadRequestException(
        "Temporary TOTP secret expired. Please generate a new QR code to configure 2FA.",
        ErrorCode.MFA_EXPIRED_TEMP_SECRET
      );
    }

    const isValid = speakeasy.totp.verify({
      secret: tempSecretDocument.secret,
      encoding: "base32",
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException(
        "The MFA code you entered is incorrect or has expired. Please request a new code to complete the verification.",
        ErrorCode.MFA_INVALID_VERIFICATION_CODE
      );
    }

    user.userPreferences.enable2FA = true;
    user.userPreferences.twoFactorSecret = tempSecretDocument.secret;
    await user.save();

    return {
      userPreferences: {
        enabled2FA: user.userPreferences.enable2FA,
      },
    };
  }

  public async revokeMFA(code: string, req: Request) {
    const currentUser = req.user as Express.User;

    if (!currentUser) {
      throw new NotFoundException("User not found.");
    }
    if (
      !currentUser.userPreferences.twoFactorSecret ||
      !currentUser.userPreferences.enable2FA
    ) {
      throw new ConflictException(
        "Two-factor authentication is already disabled.",
        ErrorCode.MFA_ALREADY_DISABLED
      );
    }
    // ! Verify 2FA Before revoke
    const isValid = speakeasy.totp.verify({
      secret: currentUser.userPreferences.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException(
        "The MFA code you entered is incorrect or has expired. Please request a new code to complete the verification.",
        ErrorCode.MFA_INVALID_VERIFICATION_CODE
      );
    }

    currentUser.userPreferences.enable2FA = false;
    currentUser.userPreferences.twoFactorSecret = undefined;
    const updatedUser = await currentUser.save();

    return { updatedUser };
  }
  public async verifyMFAForLogin(code: string, req: Request) {
    const currentUser = req.user as Express.User;
    const uaSource = req.headers["user-agent"];
    const parsedUA = useragent.parse(uaSource ?? "unknown");

    if (!currentUser) {
      throw new NotFoundException("User not found.");
    }
    if (
      !currentUser.userPreferences.twoFactorSecret ||
      !currentUser.userPreferences.enable2FA
    ) {
      throw new ConflictException(
        "Two-factor authentication is disabled.",
        ErrorCode.MFA_ALREADY_DISABLED
      );
    }
    // ! Verify 2FA Before revoke
    const isValid = speakeasy.totp.verify({
      secret: currentUser.userPreferences.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException(
        "The MFA code you entered is incorrect or has expired. Please request a new code to complete the verification.",
        ErrorCode.MFA_INVALID_VERIFICATION_CODE
      );
    }

    // ! CREATE SESSION
    const session = await SessionModel.create({
      userId: currentUser._id,
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
        userId: currentUser._id,
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

    return { currentUser, accessToken, refreshToken, mfaRequired: false };
  }
}
