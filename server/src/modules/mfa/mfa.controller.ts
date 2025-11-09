import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { MfaService } from "./mfa.service";
import { Request, Response } from "express";
import { HTTPSTATUS } from "@/config/http.config";
import { MfaRequestSchema } from "@/validators/mfa.validator";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";
import LOGIN from "@/common/enums/login-codes";
import { MFA_PATH, setAuthenticationCookies } from "@/common/utils/cookie";

export class MfaController {
  private mfaService: MfaService;
  constructor(mfaService: MfaService) {
    this.mfaService = mfaService;
  }

  public generateMFASetup = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Call Service
      const { secret, qrImageUrl } = await this.mfaService.generateMFASetup(
        req
      );
      // ! 02 Send secret & qr code to user
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          statusCode: HTTPSTATUS.OK,
          success: true,
          message: "Scan the QR code or use the setup key.",
          data: {
            secret,
            qrImageUrl,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public verifyMFASetup = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { code } = MfaRequestSchema.verifySetup.parse(req.body);

      // ! 02. Call Service
      const { userPreferences } = await this.mfaService.verifyMFASetup(
        req,
        code
      );

      // ! 03. Return response
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          statusCode: HTTPSTATUS.OK,
          success: true,
          message: "MFA setup completed successfully.",
          data: { userPreferences: userPreferences },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public revokeMFA = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { code } = MfaRequestSchema.revoke.parse(req.body);

      // ! 02. Call service
      const { updatedUser } = await this.mfaService.revokeMFA(code, req);

      // ! 03. Return data
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          statusCode: HTTPSTATUS.OK,
          success: true,
          message:
            "Two-factor authentication has been successfully disabled for your account.",
          data: {
            user: updatedUser,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public disableMFAWithBackupCode = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { backupCode } = MfaRequestSchema.disableWithBackupCode.parse(
        req.body
      );

      // ! 02. Call service
      const { updatedUser } = await this.mfaService.disableMFAWithBackupCode(
        backupCode,
        req
      );

      // ! 03. Return data
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          statusCode: HTTPSTATUS.OK,
          success: true,
          message:
            "Two-factor authentication has been successfully disabled for your account.",
          data: {
            user: updatedUser,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );

  public loginWithBackupCode = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate data
      const { backupCode } = MfaRequestSchema.loginWithBackupCode.parse(
        req.body
      );

      // ! 02. Call service
      const { updatedUser, accessToken, refreshToken, mfaRequired } =
        await this.mfaService.loginWithBackupCode(backupCode, req);

      // ! 03. Return authenticated user
      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .clearCookie("mfaToken", {
          path: MFA_PATH,
        })
        .status(HTTPSTATUS.OK)
        .json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message: "Authentication successful: User successfully login.",
            data: { mfaRequired, user: updatedUser, nextStep: LOGIN.OK },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );

  public verifyMFAForLogin = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { code } = MfaRequestSchema.verifyCodeLogin.parse(req.body);

      // ! 02. Call service
      const { currentUser, accessToken, refreshToken, mfaRequired } =
        await this.mfaService.verifyMFAForLogin(code, req);

      // ! 03. Return authenticated user
      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .clearCookie("mfaToken", {
          path: MFA_PATH,
        })
        .status(HTTPSTATUS.OK)
        .json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message: "Authentication successful: User successfully login.",
            data: { mfaRequired, user: currentUser, nextStep: LOGIN.OK },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );

  public verifyMFAForChangingPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { code } = MfaRequestSchema.verifyCodeForgotPassword.parse(
        req.body
      );

      // ! 02. Call service
      await this.mfaService.verifyMFAForChangingPassword(code, req);

      // ! 03. Return data
      return res
        .status(HTTPSTATUS.OK)
        .clearCookie("mfaToken", {
          path: MFA_PATH,
        })
        .json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message:
              "Password reset request successfully processed. Please check your email for further instructions.",
            data: { nextStep: LOGIN.OK },
            metadata: { requestId: req.requestId },
          })
        );
    }
  );
}
