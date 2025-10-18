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
} from "@/common/utils/cookie";
import { UnauthorizedException } from "@/common/utils/catch-errors";
import LOGIN from "@/common/enums/login-codes";

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
      return res.status(HTTPSTATUS.CREATED).json({
        message: "User successfully registered.",
        data: { ...user, isVerificationEmailSend },
      });
    }
  );
  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // Validate Input
      const userAgent = req.headers["user-agent"];
      const body = loginSchema.parse({
        ...req.body,
        userAgent,
      });
      // Talk with DB
      // ! SIGN-UP CONFIRMATION
      const isCompletedSignUP = await this.authService.confirmSignUp(
        body.email
      );
      // ! REDIRECT USER TO EMAIL VERIFICATION
      if (!isCompletedSignUP) {
        return res.status(HTTPSTATUS.OK).json({
          message: "Email not verified",
          code: LOGIN.CONFIRM_SIGN_UP,
        });
      }

      // ! LOGIN LOGIC
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.authService.login(body);

      // ! Return response to USER
      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: "User successfully login.",
          mfaRequired,
          user,
        });
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
        .json({
          message: "Refresh Access successfully processed.",
        });
    }
  );
  public verifyEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      // * TODO POTI ADAUGA SI EMAIL AICI SI LE ENCODEZI IN URL
      const { code } = verificationEmailSchema.parse(req.body);

      await this.authService.verifyEmail(code);

      return res.status(HTTPSTATUS.OK).json({
        message: "Email verified successfully",
        code: LOGIN.CONFIRMED_EMAIL_RETURN_TO_LOGIN,
      });
    }
  );
  public forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req.body.email);

      await this.authService.forgotPassword(email);

      return res.status(HTTPSTATUS.OK).json({
        message: "Password reset email sent",
      });
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

      return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
        message:
          "Password reset completed. If you didn’t request this change, please contact support immediately",
      });
    }
  );
}
