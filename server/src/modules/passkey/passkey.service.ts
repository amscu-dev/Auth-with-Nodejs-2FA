import useragent from "express-useragent";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { PasskeyRegisterData } from "@/common/interface/passkey.interface";
import cbor from "cbor";

import {
  AuthenticationException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@/common/utils/catch-errors";
import objectIdToUint8Array from "@/common/utils/objectIdToUint8Array";
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
import mongoose, { Schema } from "mongoose";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { clientDataJSONSchema } from "@/common/validators/passkey.validator";
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

export default class PasskeyService {
  public async confirmSignUp(userid: string) {
    const user = await UserModel.findById(userid);
    if (!user) {
      throw new BadRequestException(
        "User not found",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    if (user.isEmailVerified) return true;
    return false;
  }

  public async generatePasskeySignUpSession(
    registerData: PasskeyRegisterData
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const { email, name } = registerData;
    // ! If user already exista throw error;
    const user = await UserModel.findOne({ email });
    if (user) {
      throw new BadRequestException(
        "There is already an user registered with this email adress"
      );
    }

    const userId = new mongoose.Types.ObjectId();

    // ! Create PublicKeyCredentialCreationOptions
    const publicKeyCredentialCreationOptions =
      await generateRegistrationOptions({
        rpName: config.APP_NAME,
        rpID: "localhost",
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

    // ! Create PasskeySession
    const passkeySession = await PasskeyChallengeSessionModel.create({
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
    // ! Extract challenge from clientDataJSON
    const { challenge } = clientDataJSONSchema.parse(
      JSON.parse(
        decodeBase64(registrationResponse.response.clientDataJSON, "utf8")
      )
    );

    // ! Find Session Challenge
    const challengeSession = await PasskeyChallengeSessionModel.findOne({
      challenge: challenge,
      passkeyChallengeSessionPurpose: "signup",
    });

    if (!challengeSession) {
      throw new BadRequestException(
        "Passkey registration session not found.",
        ErrorCode.PASSKEY_CHALLENGE_INVALID
      );
    }

    if (challengeSession.consumed) {
      throw new ConflictException(
        "Passkey registration session has already been used.",
        ErrorCode.PASSKEY_CHALLENGE_ALREADY_CONSUMED
      );
    }

    if (challengeSession.passkeyChallengeSessionPurpose !== "signup") {
      throw new BadRequestException(
        "Passkey registration session purpose is invalid.",
        ErrorCode.PASSKEY_CHALLENGE__INVALID_PURPOSE
      );
    }

    // ! Verify Response
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge,
      expectedOrigin: "https://www.passkeys-debugger.io",
      expectedRPID: "passkeys-debugger.io",
      requireUserVerification: true,
    });

    if (
      !verification.verified ||
      !verification.registrationInfo ||
      !verification.registrationInfo.userVerified
    ) {
      throw new BadRequestException(
        "Passkey registration verification failed",
        ErrorCode.VERIFICATION_ERROR
      );
    }
    // ! start a mongoose session

    const mongoSession = await mongoose.startSession();
    try {
      const { newUser, verificationCode } = await mongoSession.withTransaction(
        async () => {
          // ! create new passkey
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
      mongoSession.endSession();
    }
  }

  public async generatePasskeySignInSession() {
    const publicKeyCredentialRequestOptions =
      await generateAuthenticationOptions({
        timeout: 60000,
        allowCredentials: [],
        userVerification: "required",
        rpID: "localhost",
      });

    const passkeySession = await PasskeyChallengeSessionModel.create({
      challenge: publicKeyCredentialRequestOptions.challenge,
      passkeyChallengeSessionPurpose: "signin",
    });
    return publicKeyCredentialRequestOptions;
  }

  public async verifyPasskeySessionAndAuthenticateUser(
    authenticationResponse: AuthenticationResponseJSON,
    req: Request
  ) {
    // ! Extract challenge from clientDataJSON
    const { challenge } = clientDataJSONSchema.parse(
      JSON.parse(
        decodeBase64(authenticationResponse.response.clientDataJSON, "utf8")
      )
    );
    // ! Find Session Challenge
    const challengeSession = await PasskeyChallengeSessionModel.findOne({
      challenge: challenge,
      passkeyChallengeSessionPurpose: "signin",
    });

    if (!challengeSession) {
      throw new BadRequestException(
        "Passkey registration session not found.",
        ErrorCode.PASSKEY_CHALLENGE_INVALID
      );
    }

    if (challengeSession.consumed) {
      throw new ConflictException(
        "Passkey registration session has already been used.",
        ErrorCode.PASSKEY_CHALLENGE_ALREADY_CONSUMED
      );
    }

    if (challengeSession.passkeyChallengeSessionPurpose !== "signin") {
      throw new BadRequestException(
        "Passkey registration session purpose is invalid.",
        ErrorCode.PASSKEY_CHALLENGE__INVALID_PURPOSE
      );
    }
    // ! Find User in DB
    const user = await UserModel.findById(
      authenticationResponse.response.userHandle
    );
    if (!user) {
      throw new NotFoundException("User not found please register!");
    }

    // ! Parse credential ID
    const passkey = await PasskeyModel.findOne({
      credentialID: authenticationResponse.id,
    });
    if (!passkey) {
      throw new NotFoundException(
        "Passkey not found! Please delete this key from your device and register a new one!"
      );
    }
    // ! Verify signature
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challenge,
      expectedOrigin: "https://www.passkeys-debugger.io",
      expectedRPID: "passkeys-debugger.io",
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
      throw new AuthenticationException(
        "The provided passkey challenge is invalid or could not be verified.",
        ErrorCode.PASSKEY_CHALLENGE_INVALID
      );
    }

    // ! Increment counter & update last used
    passkey.counter++;
    passkey.lastUsed = new Date();
    await passkey.save();

    // ! Create Session & JWT Tokens
    const uaSource = req.headers["user-agent"];
    const parsedUA = useragent.parse(uaSource ?? "unknown");

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
  public async generatePasskeyAddSession(userid: string, req: Request) {
    const curentUser = req.user as Express.User;

    if (curentUser.id !== userid) {
      throw new UnauthorizedException(
        "You are not authorized to add a passkey for this user."
      );
    }
    // ! Find current user passkeys
    const passkeys = await PasskeyModel.find({
      userID: userid,
    });

    const existedCredentials = passkeys.map((passkey) => ({
      id: passkey.credentialID,
      transports: passkey.transports,
    }));

    // ! Create PublicKeyCredentialCreationOptions
    const publicKeyCredentialCreationOptions =
      await generateRegistrationOptions({
        rpName: config.APP_NAME,
        rpID: "localhost",
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

    // ! Create PasskeySession
    const passkeySession = await PasskeyChallengeSessionModel.create({
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
    const curentUser = req.user as Express.User;

    if (curentUser.id !== userid) {
      throw new UnauthorizedException(
        "You are not authorized to add a passkey for this user."
      );
    }

    const { challenge } = clientDataJSONSchema.parse(
      JSON.parse(
        decodeBase64(registrationResponse.response.clientDataJSON, "utf8")
      )
    );

    // ! Find Session Challenge
    const challengeSession = await PasskeyChallengeSessionModel.findOne({
      challenge: challenge,
      passkeyChallengeSessionPurpose: "add-new-key",
      userId: userid,
    });

    if (!challengeSession) {
      throw new BadRequestException(
        "Passkey registration session not found.",
        ErrorCode.PASSKEY_CHALLENGE_INVALID
      );
    }

    if (challengeSession.consumed) {
      throw new ConflictException(
        "Passkey registration session has already been used.",
        ErrorCode.PASSKEY_CHALLENGE_ALREADY_CONSUMED
      );
    }

    if (challengeSession.passkeyChallengeSessionPurpose !== "add-new-key") {
      throw new BadRequestException(
        "Passkey registration session purpose is invalid.",
        ErrorCode.PASSKEY_CHALLENGE__INVALID_PURPOSE
      );
    }

    // ! Verify Response
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge,
      expectedOrigin: "https://www.passkeys-debugger.io",
      expectedRPID: "passkeys-debugger.io",
      requireUserVerification: true,
    });

    if (
      !verification.verified ||
      !verification.registrationInfo ||
      !verification.registrationInfo.userVerified
    ) {
      throw new BadRequestException(
        "Passkey registration verification failed",
        ErrorCode.VERIFICATION_ERROR
      );
    }

    const mongoSession = await mongoose.startSession();
    try {
      const passkey = await mongoSession.withTransaction(async () => {
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
        curentUser.userPreferences.passkeys.push(passkey.id);
        if (
          !curentUser.userPreferences.supportedAuthMethods.includes("passkey")
        ) {
          curentUser.userPreferences.supportedAuthMethods.push("passkey");
        }
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
      mongoSession.endSession();
    }
  }
  public async generatePasskeyRemoveSession(
    userid: string,
    credentialid: string,
    req: Request
  ) {
    const currentUser = req.user as Express.User;
    if (currentUser.id !== userid) {
      throw new UnauthorizedException(
        "You are not authorized to remove a passkey for this user."
      );
    }
    const currentCredential = await PasskeyModel.findOne({
      credentialID: credentialid,
    });

    if (!currentCredential) {
      throw new NotFoundException("Passkey does not exists.");
    }
    if (userid !== currentCredential.userID.toString()) {
      throw new UnauthorizedException(
        "You are not authorized to remove a passkey for this user."
      );
    }
    // ! Generate Options
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
        rpID: "localhost",
      });
    const passkeySession = await PasskeyChallengeSessionModel.create({
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
    const currentUser = req.user as Express.User;
    if (currentUser.id !== userid) {
      throw new UnauthorizedException(
        "You are not authorized to remove a passkey for this user."
      );
    }
    const passkey = await PasskeyModel.findOne({
      credentialID: credentialid,
    });

    if (!passkey) {
      throw new NotFoundException("Passkey does not exists.");
    }
    if (userid !== passkey.userID.toString()) {
      throw new UnauthorizedException(
        "You are not authorized to remove a passkey for this user."
      );
    }

    const { challenge } = clientDataJSONSchema.parse(
      JSON.parse(
        decodeBase64(authenticationResponse.response.clientDataJSON, "utf8")
      )
    );
    // ! Find Session Challenge
    const challengeSession = await PasskeyChallengeSessionModel.findOne({
      challenge: challenge,
      passkeyChallengeSessionPurpose: "delete-key",
      userId: userid,
    });

    if (!challengeSession) {
      throw new BadRequestException(
        "Passkey registration session not found.",
        ErrorCode.PASSKEY_CHALLENGE_INVALID
      );
    }

    if (challengeSession.consumed) {
      throw new ConflictException(
        "Passkey registration session has already been used.",
        ErrorCode.PASSKEY_CHALLENGE_ALREADY_CONSUMED
      );
    }

    if (challengeSession.passkeyChallengeSessionPurpose !== "delete-key") {
      throw new BadRequestException(
        "Passkey registration session purpose is invalid.",
        ErrorCode.PASSKEY_CHALLENGE__INVALID_PURPOSE
      );
    }

    // ! Verify signature
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challenge,
      expectedOrigin: "https://www.passkeys-debugger.io",
      expectedRPID: "passkeys-debugger.io",
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
      throw new AuthenticationException(
        "The provided passkey challenge is invalid or could not be verified.",
        ErrorCode.PASSKEY_CHALLENGE_INVALID
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
    // ! 1. Get verify currentUser
    const currentUser = req.user as Express.User;
    if (currentUser.id !== userid) {
      throw new UnauthorizedException(
        "You are not authorized to remove a passkey for this user."
      );
    }

    // ! 2. Get all passkey by userid
    const passkeys = await PasskeyModel.find(
      {
        userID: userid,
      },
      "credentialID aaguid createdAt lastUsed"
    );
    // ! 3. Mapping aaguid providers icons
    const mappedPasskeys = passkeys.map((p) => {
      const icons = getPasskeyProviderWithIcons(p.aaguid.aaguid);
      return {
        aaguid: icons,
        credentialId: p.credentialID,
        createdAt: p.createdAt,
        lastUsed: p.lastUsed,
      };
    });

    // ! 4. Return passkeys info
    return mappedPasskeys;
  }
}
