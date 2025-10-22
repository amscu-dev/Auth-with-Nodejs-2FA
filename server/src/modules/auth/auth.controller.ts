import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { AuthService } from "./auth.service";
import { HTTPSTATUS } from "@/config/http.config";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationEmailSchema,
} from "@/common/validators/auth.validator";
import {
  clearAuthenticationCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies,
  setMFATokenCookie,
} from "@/common/utils/cookie";
import {
  NotFoundException,
  UnauthorizedException,
} from "@/common/utils/catch-errors";
import LOGIN from "@/common/enums/login-codes";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";

export class AuthController {
  private authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
  }
  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // Validate Input
      const body = registerSchema.parse({
        ...req.body,
      });
      // Talk with DB
      const { user, isVerificationEmailSend } = await this.authService.register(
        body
      );

      // Return response to USER
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "Registration successful. A verification email has been sent to your email address.",
          data: { ...user, isVerificationEmailSend },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // Validate Input
      const uaSource = req.headers["user-agent"];
      const body = loginSchema.parse({
        ...req.body,
        uaSource,
      });

      // ! SIGN-UP CONFIRMATION
      const isCompletedSignUP = await this.authService.confirmSignUp(
        body.email
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

      // ! LOGIN LOGIC
      const { user, accessToken, refreshToken, mfaRequired, mfaToken } =
        await this.authService.login(body);

      if (mfaRequired && !accessToken && mfaToken) {
        return setMFATokenCookie({ res, mfaToken })
          .status(HTTPSTATUS.OK)
          .json(
            new ApiResponse({
              success: true,
              statusCode: HTTPSTATUS.OK,
              message:
                "Login successful! Two-factor authentication is required to complete the sign-in process.",
              data: { mfaRequired, user, nextStep: LOGIN.MFA_REQUIRED },
              metadata: {
                requestId: req.requestId,
              },
            })
          );
      }

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
  public refresh = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const refreshToken = req.cookies.refreshToken as string | undefined;

      if (!refreshToken) {
        throw new UnauthorizedException(
          "User is not authorized to perform this action.Missing refresh token."
        );
      }

      const { newRefreshToken, accessToken } =
        await this.authService.refreshToken(refreshToken);

      if (newRefreshToken) {
        res.cookie(
          "refreshToken",
          refreshToken,
          getRefreshTokenCookieOptions()
        );
      }
      return res
        .status(HTTPSTATUS.OK)
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message:
              "Access token successfully refreshed. Your session remains active.",
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );
  public verifyEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // * TODO POTI ADAUGA SI EMAIL AICI SI LE ENCODEZI IN URL
      const { code } = verificationEmailSchema.parse(req.body);

      await this.authService.verifyEmail(code);

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
  public forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req.body.email);

      await this.authService.forgotPassword(email);

      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.OK,
          message:
            "Password reset request successfully processed. Please check your email for further instructions.",
          metadata: { requestId: req.requestId },
        })
      );
    }
  );
  public resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { verificationCode, password } = resetPasswordSchema.parse(
        req.body
      );
      const ip = req.ip;
      const userAgent = req.headers["user-agent"];

      await this.authService.resetPassword(
        verificationCode,
        password,
        ip,
        userAgent
      );

      return clearAuthenticationCookies(res)
        .status(HTTPSTATUS.OK)
        .json(
          new ApiResponse({
            success: true,
            statusCode: HTTPSTATUS.OK,
            message:
              "Password reset completed. If you didn’t request this change, please contact support immediately",
            metadata: {
              requestId: req.requestId,
            },
          })
        );
    }
  );
  public logout = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const sessionId = req.sessionId;
      if (!sessionId) {
        throw new NotFoundException(
          "Logout failed: no active session found or the session has already expireds."
        );
      }
      await this.authService.logout(sessionId);

      return clearAuthenticationCookies(res)
        .status(HTTPSTATUS.OK)
        .json(
          new ApiResponse({
            statusCode: HTTPSTATUS.OK,
            success: true,
            message: "Logout successful: you have been securely signed out.",
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
