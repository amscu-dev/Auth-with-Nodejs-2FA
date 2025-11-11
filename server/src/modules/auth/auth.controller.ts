import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { AuthService } from "./auth.service";
import { HTTPSTATUS } from "@/config/http.config";
import { AuthRequestSchema } from "@/validators/auth.validator";
import {
  clearAuthenticationCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies,
  setMFATokenCookie,
} from "@/common/utils/cookie";
import { NotFoundException } from "@/common/utils/catch-errors";
import LOGIN from "@/common/enums/login-codes";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";

export class AuthController {
  private authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }
  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 1. Validate input
      const body = AuthRequestSchema.signUp.parse({
        ...req.body,
      });

      // ! 2. Call service
      const { user, isVerificationEmailSend } = await this.authService.register(
        body
      );

      // ! 3. Return response
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
  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const body = AuthRequestSchema.signIn.parse(req.body);

      // ! 02. Check if user verified his email
      const isCompletedSignUP = await this.authService.confirmSignUp(
        body.email
      );

      // ! 03. Send data with nextStep: CONFIRM_SIGN_UP
      if (!isCompletedSignUP) {
        return res.status(HTTPSTATUS.OK).json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message:
              "Two-factor authentication required. Please enter your verification code to complete this process.",
            data: { nextStep: LOGIN.CONFIRM_SIGN_UP },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
      }

      // ! 04. Verify user credentials
      const { user, accessToken, refreshToken, mfaRequired, mfaToken } =
        await this.authService.login(body);

      // ! 05. If Mfa Required send data with nextStep: MFA_REQUIRED
      if (mfaRequired && !accessToken && mfaToken) {
        return setMFATokenCookie({ res, mfaToken })
          .status(HTTPSTATUS.OK)
          .json(
            new ApiResponse({
              success: true,
              statusCode: HTTPSTATUS.OK,
              message:
                "Authentication pending, two-factor verification required to complete login.",
              data: { mfaRequired, nextStep: LOGIN.MFA_REQUIRED },
              metadata: {
                requestId: req.requestId,
              },
            })
          );
      }

      // ! 06. If none of the conditions above is true, send authentication credentials to user
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
            message:
              "Authentication successful, You have been signed in successfully.",
            data: { mfaRequired, user, nextStep: LOGIN.OK },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );
  public verifyEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { code } = AuthRequestSchema.verifyEmail.parse(req.body);

      // ! 02. Procees with code verification logic
      await this.authService.verifyEmail(code);

      // ! 03. Return response
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          statusCode: HTTPSTATUS.OK,
          success: true,
          message:
            "Email address successfully verified. You can now proceed to login.",
          data: {
            nextStep: LOGIN.CONFIRMED_EMAIL_RETURN_TO_LOGIN,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public resendEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { email } = AuthRequestSchema.resendEmail.parse(req.body);
      // ! 02. Call service
      const { isEmailSuccessfullySend } = await this.authService.resendEmail(
        email
      );
      // ! 03. Return response
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          statusCode: HTTPSTATUS.OK,
          success: true,
          message:
            "Verification code was resended to email, please check your inbox!",
          data: {
            isEmailSuccessfullySend,
            email,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public checkEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { email } = AuthRequestSchema.checkEmail.parse(req.body);
      // ! 02. Call service
      const { isNewEmail } = await this.authService.checkEmail(email);
      // ! 03. Return response
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          statusCode: HTTPSTATUS.OK,
          success: true,
          message:
            "Email does not exists in our database. Please register a new account !",
          data: {
            isNewEmail,
            email,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { email } = AuthRequestSchema.forgotPassword.parse(req.body);

      // ! 02. Call service
      const { url, mfaRequired, mfaToken } =
        await this.authService.forgotPassword(email);

      // ! 03. If user has mfa, request mfa, before sending code
      if (mfaRequired && mfaToken) {
        return setMFATokenCookie({ res, mfaToken })
          .status(HTTPSTATUS.OK)
          .json(
            new ApiResponse({
              success: true,
              statusCode: HTTPSTATUS.OK,
              message:
                "Two-factor authentication required. Please enter your verification code to complete this process.",
              data: { mfaRequired, nextStep: LOGIN.MFA_REQUIRED },
              metadata: {
                requestId: req.requestId,
              },
            })
          );
      }

      // ! 04. If user does not have mfa, send email
      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.OK,
          message:
            "Password reset request successfully processed. Please check your email for further instructions.",
          data: { mfaRequired, nextStep: LOGIN.OK },
          metadata: { requestId: req.requestId },
        })
      );
    }
  );
  public resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Validate input
      const { verificationCode, password } =
        AuthRequestSchema.resetPassword.parse(req.body);

      // ! 02. Call service
      await this.authService.resetPassword(verificationCode, password);

      // ! 03. Clear cookies and inform user that action performed well.
      return clearAuthenticationCookies(res)
        .status(HTTPSTATUS.OK)
        .json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message:
              "Password reset completed. If you didn’t request this change, please contact support immediately",
            data: {
              nextStep: LOGIN.OK,
            },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );
  public refresh = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Call Service
      const { newRefreshToken, accessToken } =
        await this.authService.refreshToken(req);

      // ! 02. If new refresh token provided sent to user
      if (newRefreshToken) {
        res.cookie(
          "refreshToken",
          newRefreshToken,
          getRefreshTokenCookieOptions()
        );
      }

      // ! 03. Send data to user
      return res
        .status(HTTPSTATUS.OK)
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message:
              "Access token successfully refreshed. Your session remains active.",
            data: {
              nextStep: LOGIN.OK,
            },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );
  public logout = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // ! 01. Get session from req
      const sessionId = req.sessionId;

      if (!sessionId) {
        throw new NotFoundException(
          "Logout failed: no active session found or the session has already expireds."
        );
      }

      // ! 02. Call service
      await this.authService.logout(sessionId);

      // ! 03. Return data and clear cookies
      return clearAuthenticationCookies(res)
        .status(HTTPSTATUS.OK)
        .json(
          new ApiResponse({
            statusCode: HTTPSTATUS.OK,
            success: true,
            message: "Logout successful, you have been securely signed out.",
            data: {
              nextStep: LOGIN.LOGOUT,
            },
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );
}
