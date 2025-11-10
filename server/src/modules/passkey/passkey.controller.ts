import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import PasskeyService from "./passkey.service";
import { Request, Response } from "express";
import { PasskeyRequestSchema } from "@/validators/passkey.validator";
import { HTTPSTATUS } from "@/config/http.config";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";
import LOGIN from "@/common/enums/login-codes";
import { setAuthenticationCookies } from "@/common/utils/cookie";
import mongoose from "mongoose";
import { base64UrlToObjectId } from "@/common/utils/mongoIdConvertToUnit8Array";

export class PasskeyController {
  private passkeyService: PasskeyService;
  constructor(passkeyService: PasskeyService) {
    this.passkeyService = passkeyService;
  }

  public generatePasskeySignUpSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const body = PasskeyRequestSchema.signUpInit.parse(req.body);

      // ! 02. Call service
      const publicKeyOpts =
        await this.passkeyService.generatePasskeySignUpSession(body);

      // ! 03. Return options to client
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "Passkey registration session has been successfully created.",
          data: {
            publicKeyOpts,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public verifyPasskeySignUpSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const registrationResponse = PasskeyRequestSchema.signUpVerify.parse(
        req.body
      );

      // ! 02. Call service
      const { user, isVerificationEmailSend } =
        await this.passkeyService.verifyPasskeySessionAndRegisterUser(
          registrationResponse
        );

      // ! 03. Return user info
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "Registration successful. A verification email has been sent to your email address.",
          data: {
            user,
            isVerificationEmailSend,
            nextStep: LOGIN.CONFIRM_SIGN_UP,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public generatePasskeySignInSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Call service
      const publicKeyCredentialRequestOptions =
        await this.passkeyService.generatePasskeySignInSession();

      // ! 02. Return data
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "Passkey authentication session has been successfully created.",
          data: {
            publicKeyCredentialRequestOptions,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public verifyPasskeySignInSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const authenticationResponse = PasskeyRequestSchema.signInVerify.parse(
        req.body
      );

      // ! 02. Confirm that user verified his email
      const { isCompletedSignUp, email } =
        await this.passkeyService.confirmSignUp(
          authenticationResponse.response.userHandle
        );
      if (!isCompletedSignUp) {
        return res.status(HTTPSTATUS.OK).json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message:
              "Authentication pending: your email address has not yet been verified. Please confirm your email to proceed.",
            data: { nextStep: LOGIN.CONFIRM_SIGN_UP, email },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
      }
      // ! 03. Call service
      const { user, accessToken, refreshToken, mfaRequired, mfaToken } =
        await this.passkeyService.verifyPasskeySessionAndAuthenticateUser(
          authenticationResponse,
          req
        );
      // ! 04. Return data to client
      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message: "Authentication successful: User successfully login.",
            data: { mfaRequired, user, nextStep: LOGIN.OK },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );

  public generatePasskeyAddSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Get user id
      const { userid } = PasskeyRequestSchema.addPasskey.parse(req.params);

      // ! 02. Call service
      const publicKeyOpts = await this.passkeyService.generatePasskeyAddSession(
        userid,
        req
      );

      // ! 03. Return data
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "Passkey registration session has been successfully created.",
          data: {
            publicKeyOpts,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public verifyPasskeyAddSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Get userid from request
      const { userid } = PasskeyRequestSchema.addPasskey.parse(req.params);

      // ! 02. Validate input
      const registrationResponse = PasskeyRequestSchema.signUpVerify.parse(
        req.body
      );

      // ! 03. Call service
      const passkey =
        await this.passkeyService.verifyPasskeyAddSessionAndAddPasskey(
          registrationResponse,
          userid,
          req
        );

      // ! 04. Return data
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message: "Passkey was successfully added.",
          data: {
            passkey,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public generatePasskeyRemoveSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Get userid & credentialid
      const { userid, credentialid } = PasskeyRequestSchema.removePasskey.parse(
        req.params
      );

      // ! 02. Call service
      const publicKeyCredentialRequestOptions =
        await this.passkeyService.generatePasskeyRemoveSession(
          userid,
          credentialid,
          req
        );

      // ! 03. Return data
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message: "Passkey remove session has been successfully created.",
          data: {
            publicKeyCredentialRequestOptions,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public verifyPasskeyRemoveSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Extract data from request
      const { userid, credentialid } = PasskeyRequestSchema.removePasskey.parse(
        req.params
      );
      // ! 02. Validate data
      const authenticationResponse = PasskeyRequestSchema.signInVerify.parse(
        req.body
      );

      // ! 03. Call service
      await this.passkeyService.verifyPasskeyRemoveSessionAndRemovePasskey(
        userid,
        credentialid,
        authenticationResponse,
        req
      );

      // ! 04. Return response
      return res.status(HTTPSTATUS.NO_CONTENT).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.NO_CONTENT,
          message: "Passkey  has been successfully removed.",
          data: {},
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public getAllUserPasskeys = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 1. Extract user
      const { userid } = PasskeyRequestSchema.getAllPasskey.parse(req.params);

      // ! 2. Call service
      const mappedPasskeys = await this.passkeyService.getAllPaskeyByUserId(
        userid,
        req
      );

      // ! 3. Return response to user
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.OK,
          message: "All passkeys was successfully retreived.",
          data: {
            passkeys: mappedPasskeys,
          },
          metadata: {
            requestId: req.requestId,
            count: mappedPasskeys.length,
          },
        })
      );
    }
  );
}
