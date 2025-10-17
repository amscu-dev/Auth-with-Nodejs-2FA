import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { AuthService } from "./auth.service";
import { HTTPSTATUS } from "@/config/http.config";
import {
  loginSchema,
  registerSchema,
} from "@/common/validators/auth.validator";
import { setAuthenticationCookies } from "@/common/utils/cookie";

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
}
