import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { AuthService } from "./auth.service";
import { HTTPSTATUS } from "@/config/http.config";
import {
  loginSchema,
  registerSchema,
} from "@/common/validators/auth.validator";
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies,
} from "@/common/utils/cookie";
import { UnauthorizedException } from "@/common/utils/catch-errors";

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
      const { user } = await this.authService.register(body);
      // Return response to USER
      return res.status(HTTPSTATUS.CREATED).json({
        message: "User successfully registered.",
        data: user,
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
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.authService.login(body);

      //  Return response to USER
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
}
