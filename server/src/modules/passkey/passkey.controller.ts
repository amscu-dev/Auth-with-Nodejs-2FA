import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import PasskeyService from "./passkey.service";
import { Request, Response } from "express";
import {
  addPasskeyRequestSchema,
  getAllPaskeySchema,
  passkeyAuthenticationResponseJSONSchema,
  passkeyRegisterSchema,
  passkeyRegistrationResponseJSONSchema,
  removePasskeyRequestSchema,
} from "@/common/validators/passkey.validator";
import { HTTPSTATUS } from "@/config/http.config";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";
import LOGIN from "@/common/enums/login-codes";
import { setAuthenticationCookies } from "@/common/utils/cookie";

export class PasskeyController {
  private passkeyService: PasskeyService;
  constructor(passkeyService: PasskeyService) {
    this.passkeyService = passkeyService;
  }
  // ok
  public generatePasskeySignUpSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const body = passkeyRegisterSchema.parse(req.body);

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
  // ok
  public verifyPasskeySignUpSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const registrationResponse = passkeyRegistrationResponseJSONSchema.parse(
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
  // ok
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
  // ok
  public verifyPasskeySignInSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const authenticationResponse =
        passkeyAuthenticationResponseJSONSchema.parse(req.body);

      // ! 02. Confirm that user verified his email
      const isCompletedSignUP = await this.passkeyService.confirmSignUp(
        authenticationResponse.response.userHandle
      );
      if (!isCompletedSignUP) {
        return res.status(HTTPSTATUS.OK).json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message:
              "Authentication pending: your email address has not yet been verified. Please confirm your email to proceed.",
            data: { nextStep: LOGIN.CONFIRM_SIGN_UP },
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
  //
  public generatePasskeyAddSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { userid } = addPasskeyRequestSchema.parse(req.params);
      const publicKeyOpts = await this.passkeyService.generatePasskeyAddSession(
        userid,
        req
      );

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
      const { userid } = addPasskeyRequestSchema.parse(req.params);
      const registrationResponse = passkeyRegistrationResponseJSONSchema.parse(
        req.body
      );
      const passkey =
        await this.passkeyService.verifyPasskeyAddSessionAndAddPasskey(
          registrationResponse,
          userid,
          req
        );
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
      const { userid, credentialid } = removePasskeyRequestSchema.parse(
        req.params
      );

      const publicKeyCredentialRequestOptions =
        await this.passkeyService.generatePasskeyRemoveSession(
          userid,
          credentialid,
          req
        );
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
      const { userid, credentialid } = removePasskeyRequestSchema.parse(
        req.params
      );
      const authenticationResponse =
        passkeyAuthenticationResponseJSONSchema.parse(req.body);
      await this.passkeyService.verifyPasskeyRemoveSessionAndRemovePasskey(
        userid,
        credentialid,
        authenticationResponse,
        req
      );

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
      // ! 1. Validation
      const { userid } = getAllPaskeySchema.parse(req.params);

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
