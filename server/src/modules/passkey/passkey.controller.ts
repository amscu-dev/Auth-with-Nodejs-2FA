import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import PasskeyService from "./passkey.service";
import { Request, Response } from "express";
import {
  addPasskeyRequestSchema,
  passkeyAuthenticationResponseJSONSchema,
  passkeyRegisterSchema,
  passkeyRegistrationResponseJSONSchema,
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
  public generatePasskeySignUpSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = passkeyRegisterSchema.parse(req.body);
      const publicKeyOpts =
        await this.passkeyService.generatePasskeySignUpSession(body);
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
      const registrationResponse = passkeyRegistrationResponseJSONSchema.parse(
        req.body
      );
      const { user, isVerificationEmailSend } =
        await this.passkeyService.verifyPasskeySessionAndRegisterUser(
          registrationResponse
        );

      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "Registration successful. A verification email has been sent to your email address.",
          data: {
            ...user,
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
      const publicKeyCredentialRequestOptions =
        await this.passkeyService.generatePasskeySignInSession();

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
      const authenticationResponse =
        passkeyAuthenticationResponseJSONSchema.parse(req.body);

      // ! SIGN-UP CONFIRMATION
      const isCompletedSignUP = await this.passkeyService.confirmSignUp(
        authenticationResponse.response.userHandle
      );
      // ! REDIRECT USER TO EMAIL VERIFICATION
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

      const { user, accessToken, refreshToken, mfaRequired, mfaToken } =
        await this.passkeyService.verifyPasskeySessionAndAuthenticateUser(
          authenticationResponse,
          req
        );
      // ! Return response to USER
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
}
