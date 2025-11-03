import useragent from "express-useragent";
import { config } from "@/config/app.config";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { Request } from "express";
import {
  BadRequestException,
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "@/common/utils/catch-errors";
import { ErrorCode } from "@/common/enums/error-code.enum";
import TempTOTPSecretModel from "@/database/models/tempTOTPSecret.model";
import { anHourFromNow, tenMinutesFromNow } from "@/common/utils/date-time";
import UserModel from "@/database/models/user.model";
import SessionModel from "@/database/models/session.model";
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
  signJwtToken,
} from "@/common/utils/jwt";
import { generateBackupCodes } from "@/common/utils/generate-backup-codes";
import { BackupCodeType } from "@/common/validators/backup.validator";
import { decrypt, encrypt } from "@/common/utils/encrypt-decrypt";
import VerificationCodeModel from "@/database/models/verification.model";
import { VerificationEnum } from "@/common/enums/verification-code.enum";
import apiRequestWithRetry from "@/common/utils/retry-api";
import { sendEmail } from "@/mailers/mailer";
import { passwordResetTemplate } from "@/mailers/templates/template";

export class MfaService {
  public async generateMFASetup(req: Express.Request) {
    // ! Already verified that user exists in JWT middleware so ex can safetly assert it
    const user = req.user as Express.User;

    if (user.userPreferences.enable2FA) {
      throw new ConflictException(
        "Two-factor authentication is already active. No further action is required.",
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
        "Two-factor authentication is already active. No further action is required.",
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
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException(
        "The MFA code you entered is incorrect or has expired. Please request a new code to complete the verification.",
        ErrorCode.MFA_INVALID_VERIFICATION_CODE
      );
    }

    // ! Encrypt 2fa key
    const encryptedTwoFactorSecret = encrypt(
      tempSecretDocument.secret,
      user.id,
      config.CRYPTO_SYMMETRIC_KEY
    );

    const { backupCodes, hashedBackupCodes } = await generateBackupCodes(8);
    user.userPreferences.enable2FA = true;
    // ! we store encrypted version of the key
    user.userPreferences.twoFactorSecret = encryptedTwoFactorSecret;
    user.userPreferences.backupCodes = hashedBackupCodes;
    await user.save();

    return {
      userPreferences: {
        enabled2FA: user.userPreferences.enable2FA,
        backupCodes,
      },
    };
  }

  public async verifyMFAForChangingPassword(code: string, req: Request) {
    const currentUser = req.user as Express.User;

    if (!currentUser) {
      throw new NotFoundException("User not found.");
    }
    if (
      !currentUser.userPreferences.twoFactorSecret ||
      !currentUser.userPreferences.enable2FA
    ) {
      throw new BadRequestException(
        "Cannot verify MFA because two-factor authentication is not enabled for this account.",
        ErrorCode.MFA_NOT_ENABLED
      );
    }
    // ! Decrypt Key
    const decryptedKey = decrypt(
      currentUser.userPreferences.twoFactorSecret,
      currentUser.id,
      config.CRYPTO_SYMMETRIC_KEY
    );
    // ! Verify 2FA
    const isValid = speakeasy.totp.verify({
      secret: decryptedKey,
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

    // ! We already check for limit rate in /forgotPassword API so we can proceed to send email.
    // ! Create a new Code
    const expiresAt = anHourFromNow();
    const validCode = await VerificationCodeModel.create({
      userId: currentUser._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    });

    // ! Create reset Link
    const resetLink = `${config.APP_ORIGIN}/reset-password?code=${
      validCode.code
    }&exp=${expiresAt.getTime()}`;

    const isResetPasswordEmailSend = await apiRequestWithRetry(() =>
      sendEmail({
        to: currentUser.email,
        ...passwordResetTemplate(resetLink),
      })
    );

    if (!isResetPasswordEmailSend) {
      throw new InternalServerException();
    }

    return {
      url: resetLink,
    };
  }

  public async revokeMFA(code: string, req: Request) {
    const currentUser = req.user as Express.User;

    if (!currentUser) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    if (
      !currentUser.userPreferences.twoFactorSecret ||
      !currentUser.userPreferences.enable2FA
    ) {
      throw new ConflictException(
        "Two-factor authentication is already disabled. No further action is required.",
        ErrorCode.MFA_ALREADY_DISABLED
      );
    }

    // ! First we decrypt the 2fa key

    const decryptedKey = decrypt(
      currentUser.userPreferences.twoFactorSecret,
      currentUser.id,
      config.CRYPTO_SYMMETRIC_KEY
    );
    // ! Verify 2FA Before revoke
    const isValid = speakeasy.totp.verify({
      // ! we verify with decrypted key
      secret: decryptedKey,
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
    currentUser.userPreferences.backupCodes = undefined;
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
      throw new BadRequestException(
        "Cannot verify MFA because two-factor authentication is not enabled for this account.",
        ErrorCode.MFA_NOT_ENABLED
      );
    }

    const decryptedKey = decrypt(
      currentUser.userPreferences.twoFactorSecret,
      currentUser.id,
      config.CRYPTO_SYMMETRIC_KEY
    );
    // ! Verify 2FA Before revoke
    const isValid = speakeasy.totp.verify({
      secret: decryptedKey,
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
        sub: currentUser.id,
        userId: currentUser.id,
        sessionId: session.id,
        type: "access",
        role: "user",
      },
      { ...accessTokenSignOptions }
    );

    const refreshToken = signJwtToken(
      {
        sub: currentUser.id,
        userId: currentUser.id,
        sessionId: session.id,
        type: "refresh",
      },
      { ...refreshTokenSignOptions }
    );

    return { currentUser, accessToken, refreshToken, mfaRequired: false };
  }
  public async loginWithBackupCode(code: BackupCodeType, req: Request) {
    const currentUser = req.user as Express.User;

    const uaSource = req.headers["user-agent"];
    const parsedUA = useragent.parse(uaSource ?? "unknown");

    if (!currentUser) {
      throw new NotFoundException("User not found.");
    }

    // ! Verify validity of backupcode
    const { isValidBackupCode, matchedCode } =
      await currentUser.validateBackupCode(code);

    if (!isValidBackupCode) {
      throw new BadRequestException(
        "The backup code you entered is invalid or has already been used. Please try a different one.",
        ErrorCode.BACKUPCODE_INVALID_CODE
      );
    }
    // ! Remove used code
    const updatedUser = await UserModel.findByIdAndUpdate(
      currentUser._id,
      { $pull: { "userPreferences.backupCodes": matchedCode } },
      { new: true }
    );

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
        sub: currentUser.id,
        userId: currentUser.id,
        sessionId: session.id,
        type: "access",
        role: "user",
      },
      { ...accessTokenSignOptions }
    );

    const refreshToken = signJwtToken(
      {
        sub: currentUser.id,
        userId: currentUser.id,
        sessionId: session.id,
        type: "refresh",
      },
      { ...refreshTokenSignOptions }
    );

    return { updatedUser, accessToken, refreshToken, mfaRequired: false };
  }
  public async disableMFAWithBackupCode(code: BackupCodeType, req: Request) {
    const currentUser = req.user as Express.User;
    // ! Check if user have 2fa disabled
    if (
      !currentUser.userPreferences.twoFactorSecret ||
      !currentUser.userPreferences.enable2FA
    ) {
      throw new ConflictException(
        "Two-factor authentication is already disabled. No further action is required.",
        ErrorCode.MFA_ALREADY_DISABLED
      );
    }
    // ! Verify validity of backupcode
    const { isValidBackupCode, matchedCode } =
      await currentUser.validateBackupCode(code);

    if (!isValidBackupCode) {
      throw new BadRequestException(
        "The backup code you entered is invalid or has already been used. Please try a different one.",
        ErrorCode.BACKUPCODE_INVALID_CODE
      );
    }
    // ! Remove all codes + disabled 2fa + remove 2fa secret;
    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: currentUser._id,
        "userPreferences.backupCodes": { $elemMatch: { $eq: matchedCode } },
      },
      {
        $set: {
          "userPreferences.enable2FA": false,
          "userPreferences.backupCodes": [],
        },
        $unset: {
          "userPreferences.twoFactorSecret": "",
        },
      },
      { new: true } // <- aici
    );
    if (!updatedUser) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    return { updatedUser };
  }
}
