import useragent from "express-useragent";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { PasskeyRegisterData } from "@/common/interface/passkey.interface";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@/common/utils/catch-errors";
import { objectIdToUint8Array } from "@/common/utils/mongoIdConvertToUnit8Array";
import { generateUniqueCode } from "@/common/utils/uuid";
import { config } from "@/config/app.config";
import { PasskeyChallengeSessionModel } from "@/database/models/passkeyChallengeSession.model";
import UserModel from "@/database/models/user.model";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import mongoose from "mongoose";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { clientDataJSONSchema } from "@/validators/passkey.validator";
import decodeBase64 from "@/common/utils/decodeBase64";
import { uint8ArrayToBase64 } from "@/common/utils/uint8ArrayToBase64";
import {
  getPasskeyProvider,
  getPasskeyProviderWithIcons,
} from "@/common/utils/getPasskeyProvider";
import { PasskeyModel } from "@/database/models/passkey.model";
import VerificationCodeModel from "@/database/models/verification.model";
import { VerificationEnum } from "@/common/enums/verification-code.enum";
import { fortyFiveMinutesFromNow } from "@/common/utils/date-time";
import apiRequestWithRetry from "@/common/utils/retry-api";
import { sendEmail } from "@/mailers/mailer";
import { verifyEmailTemplate } from "@/mailers/templates/template";
import { Request } from "express";
import SessionModel from "@/database/models/session.model";
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
  signJwtToken,
} from "@/common/utils/jwt";
import { getInfoFromAsyncLocalStorage } from "@/common/context/asyncLocalStorage";

export default class PasskeyService {
  public async confirmSignUp(userid: string) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    if (user.isEmailVerified)
      return {
        isCompletedSignUp: true,
        email: user.email,
      };
    return {
      isCompletedSignUp: false,
      email: user.email,
    };
  }

  public async generatePasskeySignUpSession(
    registerData: PasskeyRegisterData
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    // ! 01. Extract data
    const { email, name } = registerData;

    // ! 02. If user already exista throw error;
    const user = await UserModel.findOne({ email });
    if (user) {
      throw new BadRequestException(
        "Registration failed, this email address is already associated with an existing account.",
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }

    const userId = new mongoose.Types.ObjectId();
    // ! 03. Create PublicKeyCredentialCreationOptions
    const publicKeyCredentialCreationOptions =
      await generateRegistrationOptions({
        rpName: config.APP_NAME,
        rpID: config.FRONTEND_HOST,
        userName: email,
        userDisplayName: name,
        userID: objectIdToUint8Array(userId),
        timeout: 60000,
        excludeCredentials: [],
        authenticatorSelection: {
          residentKey: "required",
          requireResidentKey: true,
          userVerification: "required",
        },
        attestationType: "direct",
        extensions: {
          credProps: true,
        },
        supportedAlgorithmIDs: [-7, -8, -257],
      });
    // ! 04. Create PasskeySession
    await PasskeyChallengeSessionModel.create({
      challenge: publicKeyCredentialCreationOptions.challenge,
      passkeyChallengeSessionPurpose: "signup",
      userId,
      userEmail: email,
      userName: name,
    });

    return publicKeyCredentialCreationOptions;
  }

  public async verifyPasskeySessionAndRegisterUser(
    registrationResponse: RegistrationResponseJSON
  ) {
    // ! 01. Extract challenge from clientDataJSON
    const { challenge } = clientDataJSONSchema.parse(
      JSON.parse(
        decodeBase64(registrationResponse.response.clientDataJSON, "utf8")
      )
    );

    // ! 02. Find session challenge
    const challengeSession = await PasskeyChallengeSessionModel.findOne({
      challenge: challenge,
      passkeyChallengeSessionPurpose: "signup",
    });

    if (!challengeSession) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey registration session was not found or is invalid. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION_INVALID
      );
    }

    if (challengeSession.consumed) {
      throw new ConflictException(
        "Authentication failed, the passkey session has already been used. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION_CONSUMED
      );
    }

    if (challengeSession.passkeyChallengeSessionPurpose !== "signup") {
      throw new BadRequestException(
        "Authentication failed, the passkey session purpose does not match the expected type. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION__INVALID_PURPOSE
      );
    }
    if (challengeSession.expiresAt < new Date()) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey session has expired. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION__EXPIRED
      );
    }

    // ! 03. Verify response
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge,
      expectedOrigin: config.FRONTEND_ORIGIN,
      expectedRPID: config.FRONTEND_HOST,
      requireUserVerification: true,
    });

    if (
      !verification.verified ||
      !verification.registrationInfo ||
      !verification.registrationInfo.userVerified
    ) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey verification could not be completed successfully. Please ensure you are using the correct passkey and try again.",
        ErrorCode.PASSKEY_CHALENGE_VERIFICATION_ERROR
      );
    }

    // ! 04. In verification passess save passkey, and succesfully register user
    const mongoSession = await mongoose.startSession();
    try {
      const { newUser, verificationCode } = await mongoSession.withTransaction(
        async () => {
          // ! 05. Create new passkey
          const passkey = new PasskeyModel({
            userID: challengeSession.userId,
            credentialID: verification.registrationInfo.credential.id,
            credentialPublicKey: uint8ArrayToBase64(
              verification.registrationInfo.credential.publicKey
            ),
            credentialType: verification.registrationInfo.credentialType,
            authenticatorAttachment:
              registrationResponse.authenticatorAttachment,
            publicKeyAlgorithm:
              registrationResponse.response.publicKeyAlgorithm,
            counter: verification.registrationInfo.credential.counter,
            transports: verification.registrationInfo.credential.transports,
            aaguid: {
              aaguid: verification.registrationInfo.aaguid,
              name: getPasskeyProvider(verification.registrationInfo.aaguid),
            },
          });

          // ! 06. Create new user
          const newUser = new UserModel({
            _id: challengeSession.userId,
            email: challengeSession.userEmail,
            name: challengeSession.userName,
            password: generateUniqueCode(),
            isEmailVerified: false,
            userPreferences: {
              enable2FA: false,
              emailNotification: true,
              registerMethod: "passkey",
              supportedAuthMethods: ["passkey"],
              passkey: [passkey._id],
            },
          });
          // ! 07. Create and send verification code
          const verificationCode = new VerificationCodeModel({
            userId: newUser._id,
            type: VerificationEnum.EMAIL_VERIFICATION,
            expiresAt: fortyFiveMinutesFromNow(),
          });
          challengeSession.consumed = true;
          await challengeSession.save({ session: mongoSession });
          await newUser.save({ session: mongoSession });
          await passkey.save({ session: mongoSession });
          await verificationCode.save({ session: mongoSession });
          return { newUser, verificationCode };
        }
      );
      // ! 08. Send verification code
      const verificationURL = `${config.FRONTEND_ORIGIN}/accounts/confirm-email?code=${verificationCode.code}&email=${challengeSession.userEmail}`;
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
      await mongoSession.endSession();
    }
  }

  public async generatePasskeySignInSession() {
    // ! 01. Generate credentials for webauth
    const publicKeyCredentialRequestOptions =
      await generateAuthenticationOptions({
        timeout: 60000,
        allowCredentials: [],
        userVerification: "required",
        rpID: config.FRONTEND_HOST,
      });

    // ! 02. Create session in db
    await PasskeyChallengeSessionModel.create({
      challenge: publicKeyCredentialRequestOptions.challenge,
      passkeyChallengeSessionPurpose: "signin",
    });
    return publicKeyCredentialRequestOptions;
  }

  public async verifyPasskeySignInSessionAndAuthenticateUser(
    authenticationResponse: AuthenticationResponseJSON,
    req: Request
  ) {
    const { reqUserAgent } = getInfoFromAsyncLocalStorage();
    // ! 01. Extract challenge from clientDataJSON
    const { challenge } = clientDataJSONSchema.parse(
      JSON.parse(
        decodeBase64(authenticationResponse.response.clientDataJSON, "utf8")
      )
    );
    // ! 02. Find Session Challenge
    const challengeSession = await PasskeyChallengeSessionModel.findOne({
      challenge: challenge,
      passkeyChallengeSessionPurpose: "signin",
    });

    if (!challengeSession) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey registration session was not found or is invalid. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION_INVALID
      );
    }

    if (challengeSession.consumed) {
      throw new ConflictException(
        "Authentication failed, the passkey session has already been used. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION_CONSUMED
      );
    }

    if (challengeSession.passkeyChallengeSessionPurpose !== "signin") {
      throw new BadRequestException(
        "Authentication failed, the passkey session purpose does not match the expected type. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION__INVALID_PURPOSE
      );
    }
    if (challengeSession.expiresAt < new Date()) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey session has expired. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION__EXPIRED
      );
    }

    // ! 03. Find user provided by authentificator
    const user = await UserModel.findById(
      authenticationResponse.response.userHandle
    );
    if (!user) {
      throw new NotFoundException(
        "User with the specified email was not found.",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    // ! 04. Parse credential Id
    const passkey = await PasskeyModel.findOne({
      credentialID: authenticationResponse.id,
    });
    if (!passkey) {
      throw new UnauthorizedException(
        "Authentication failed, the provided passkey could not be found or is invalid. Please remove this passkey from your device and register a new one.",
        ErrorCode.PASSKEY_NOT_FOUND
      );
    }
    // ! 05. Verify signature
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challenge,
      expectedOrigin: config.FRONTEND_ORIGIN,
      expectedRPID: config.FRONTEND_HOST,
      credential: {
        id: passkey.credentialID,
        publicKey: Uint8Array.from(
          Buffer.from(passkey.credentialPublicKey, "base64")
        ),
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });

    if (!verification.verified) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey verification could not be completed successfully. Please ensure you are using the correct passkey and try again.",
        ErrorCode.PASSKEY_CHALENGE_VERIFICATION_ERROR
      );
    }

    // ! 06. Increment counter & update last used
    passkey.counter++;
    passkey.lastUsed = new Date();
    await passkey.save();

    const session = await SessionModel.create({
      userId: user._id,
      userAgent: reqUserAgent,
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

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
      mfaToken: "",
    };
  }

  public async generatePasskeyAddSession(userid: string, req: Request) {
    // ! 01. Extract user from request (added & verified user existance in passport middleware)
    const curentUser = req.user as Express.User;

    if (curentUser.id !== userid) {
      throw new ForbiddenException(
        "Access denied, you do not have permission to perform this action.",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }
    // ! 02. Find current user passkeys
    const passkeys = await PasskeyModel.find({
      userID: userid,
    });

    const existedCredentials = passkeys.map((passkey) => ({
      id: passkey.credentialID,
      transports: passkey.transports,
    }));

    // ! 03. Create PublicKeyCredentialCreationOptions
    const publicKeyCredentialCreationOptions =
      await generateRegistrationOptions({
        rpName: config.APP_NAME,
        rpID: config.FRONTEND_HOST,
        userName: curentUser.email,
        userDisplayName: curentUser.name,
        userID: objectIdToUint8Array(curentUser._id),
        timeout: 60000,
        excludeCredentials: existedCredentials,
        authenticatorSelection: {
          residentKey: "required",
          requireResidentKey: true,
          userVerification: "required",
        },
        attestationType: "direct",
        extensions: {
          credProps: true,
        },
        supportedAlgorithmIDs: [-7, -8, -257],
      });

    // ! 04. Create PasskeySession
    await PasskeyChallengeSessionModel.create({
      challenge: publicKeyCredentialCreationOptions.challenge,
      passkeyChallengeSessionPurpose: "add-new-key",
      userId: curentUser._id,
      userEmail: curentUser.email,
      userName: curentUser.name,
    });
    return publicKeyCredentialCreationOptions;
  }

  public async verifyPasskeyAddSessionAndAddPasskey(
    registrationResponse: RegistrationResponseJSON,
    userid: string,
    req: Request
  ) {
    // ! 01. Extract user from request (added & verified user existance in passport middleware)
    const curentUser = req.user as Express.User;

    if (curentUser.id !== userid) {
      throw new ForbiddenException(
        "Access denied, you do not have permission to perform this action.",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }

    const { challenge } = clientDataJSONSchema.parse(
      JSON.parse(
        decodeBase64(registrationResponse.response.clientDataJSON, "utf8")
      )
    );

    // ! 02. Find session challenge
    const challengeSession = await PasskeyChallengeSessionModel.findOne({
      challenge: challenge,
      passkeyChallengeSessionPurpose: "add-new-key",
      userId: userid,
    });

    if (!challengeSession) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey registration session was not found or is invalid. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION_INVALID
      );
    }

    if (challengeSession.consumed) {
      throw new ConflictException(
        "Authentication failed, the passkey session has already been used. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION_CONSUMED
      );
    }

    if (challengeSession.passkeyChallengeSessionPurpose !== "add-new-key") {
      throw new BadRequestException(
        "Authentication failed, the passkey session purpose does not match the expected type. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION__INVALID_PURPOSE
      );
    }
    if (challengeSession.expiresAt < new Date()) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey session has expired. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION__EXPIRED
      );
    }

    // ! 03. Verify response
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge,
      expectedOrigin: config.FRONTEND_ORIGIN,
      expectedRPID: config.FRONTEND_HOST,
      requireUserVerification: true,
    });

    if (
      !verification.verified ||
      !verification.registrationInfo ||
      !verification.registrationInfo.userVerified
    ) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey verification could not be completed successfully. Please ensure you are using the correct passkey and try again.",
        ErrorCode.PASSKEY_CHALENGE_VERIFICATION_ERROR
      );
    }

    const mongoSession = await mongoose.startSession();
    try {
      const passkey = await mongoSession.withTransaction(async () => {
        // ! 04. Create new passkey
        const passkey = new PasskeyModel({
          userID: challengeSession.userId,
          credentialID: verification.registrationInfo.credential.id,
          credentialPublicKey: uint8ArrayToBase64(
            verification.registrationInfo.credential.publicKey
          ),
          credentialType: verification.registrationInfo.credentialType,
          authenticatorAttachment: registrationResponse.authenticatorAttachment,
          publicKeyAlgorithm: registrationResponse.response.publicKeyAlgorithm,
          counter: verification.registrationInfo.credential.counter,
          transports: verification.registrationInfo.credential.transports,
          aaguid: {
            aaguid: verification.registrationInfo.aaguid,
            name: getPasskeyProvider(verification.registrationInfo.aaguid),
          },
        });

        // ! 05. Update user
        curentUser.userPreferences.passkeys.push(passkey.id);
        if (
          !curentUser.userPreferences.supportedAuthMethods.includes("passkey")
        ) {
          curentUser.userPreferences.supportedAuthMethods.push("passkey");
        }

        // ! 06. Mark session as consumed
        challengeSession.consumed = true;
        await challengeSession.save({ session: mongoSession });
        await passkey.save({ session: mongoSession });
        await curentUser.save({ session: mongoSession });
        return passkey;
      });
      return passkey;
    } catch (error) {
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  }

  public async generatePasskeyRemoveSession(
    userid: string,
    credentialid: string,
    req: Request
  ) {
    // ! 01. Extract user from request (added & verified user existance in passport middleware)
    const currentUser = req.user as Express.User;
    if (currentUser.id !== userid) {
      throw new ForbiddenException(
        "Access denied, you do not have permission to perform this action.",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }
    // ! 02. Find passkey
    const currentCredential = await PasskeyModel.findOne({
      credentialID: credentialid,
    });

    if (!currentCredential) {
      throw new NotFoundException(
        "Authentication failed, the provided passkey could not be found or is invalid. Please remove this passkey from your device and register a new one.",
        ErrorCode.PASSKEY_NOT_FOUND
      );
    }
    if (userid !== currentCredential.userID.toString()) {
      throw new ForbiddenException(
        "Access denied, you do not have permission to perform this action.",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }
    // ! 03. Generate options
    const publicKeyCredentialRequestOptions =
      await generateAuthenticationOptions({
        timeout: 60000,
        allowCredentials: [
          {
            id: currentCredential.credentialID,
            transports: currentCredential.transports,
          },
        ],
        userVerification: "required",
        rpID: config.FRONTEND_HOST,
      });
    // ! 04. Create session
    await PasskeyChallengeSessionModel.create({
      challenge: publicKeyCredentialRequestOptions.challenge,
      passkeyChallengeSessionPurpose: "delete-key",
    });

    return publicKeyCredentialRequestOptions;
  }

  public async verifyPasskeyRemoveSessionAndRemovePasskey(
    userid: string,
    credentialid: string,
    authenticationResponse: AuthenticationResponseJSON,
    req: Request
  ) {
    // ! 01. Extract user from request (added & verified user existance in passport middleware)
    const currentUser = req.user as Express.User;
    if (currentUser.id !== userid) {
      throw new ForbiddenException(
        "Access denied, you do not have permission to perform this action.",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }
    // ! 02. Find passkey
    const passkey = await PasskeyModel.findOne({
      credentialID: credentialid,
    });

    if (!passkey) {
      throw new NotFoundException(
        "Authentication failed, the provided passkey could not be found or is invalid. Please remove this passkey from your device and register a new one.",
        ErrorCode.PASSKEY_NOT_FOUND
      );
    }
    if (userid !== passkey.userID.toString()) {
      throw new ForbiddenException(
        "Access denied, you do not have permission to perform this action.",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }

    // ! 03. Extract challenge
    const { challenge } = clientDataJSONSchema.parse(
      JSON.parse(
        decodeBase64(authenticationResponse.response.clientDataJSON, "utf8")
      )
    );

    // ! 04. Find session challenge
    const challengeSession = await PasskeyChallengeSessionModel.findOne({
      challenge: challenge,
      passkeyChallengeSessionPurpose: "delete-key",
    });

    if (!challengeSession) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey registration session was not found or is invalid. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION_INVALID
      );
    }

    if (challengeSession.consumed) {
      throw new ConflictException(
        "Authentication failed, the passkey session has already been used. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION_CONSUMED
      );
    }

    if (challengeSession.passkeyChallengeSessionPurpose !== "delete-key") {
      throw new BadRequestException(
        "Authentication failed, the passkey session purpose does not match the expected type. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION__INVALID_PURPOSE
      );
    }
    if (challengeSession.expiresAt < new Date()) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey session has expired. Please restart the passkey process.",
        ErrorCode.PASSKEY_CHALLENGE_SESSION__EXPIRED
      );
    }

    // ! 05. Verify signature
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challenge,
      expectedOrigin: config.FRONTEND_ORIGIN,
      expectedRPID: config.FRONTEND_HOST,
      credential: {
        id: passkey.credentialID,
        publicKey: Uint8Array.from(
          Buffer.from(passkey.credentialPublicKey, "base64")
        ),
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });

    if (!verification.verified) {
      throw new UnauthorizedException(
        "Authentication failed, the passkey verification could not be completed successfully. Please ensure you are using the correct passkey and try again.",
        ErrorCode.PASSKEY_CHALENGE_VERIFICATION_ERROR
      );
    }
    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        await PasskeyModel.deleteOne(
          { _id: passkey._id },
          { session: mongoSession }
        );
        await UserModel.updateOne(
          { _id: currentUser._id },
          { $pull: { passkeys: passkey._id } },
          { session: mongoSession }
        );
        challengeSession.consumed = true;
        await challengeSession.save({ session: mongoSession });
      });
    } catch (error) {
    } finally {
      await mongoSession.endSession();
    }
  }

  public async getAllPaskeyByUserId(userid: string, req: Request) {
    // ! 01. Get verify currentUser
    const currentUser = req.user as Express.User;
    if (currentUser.id !== userid) {
      throw new ForbiddenException(
        "Access denied, you do not have permission to perform this action.",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }

    // ! 02. Get all passkey by userid
    const passkeys = await PasskeyModel.find(
      {
        userID: userid,
      },
      "credentialID aaguid createdAt lastUsed"
    );
    // ! 03. Mapping aaguid providers icons
    const mappedPasskeys = passkeys.map((p) => {
      const icons = getPasskeyProviderWithIcons(p.aaguid.aaguid);
      return {
        aaguid: icons,
        credentialId: p.credentialID,
        createdAt: p.createdAt,
        lastUsed: p.lastUsed,
      };
    });

    // ! 04. Return passkeys info
    return mappedPasskeys;
  }
}
