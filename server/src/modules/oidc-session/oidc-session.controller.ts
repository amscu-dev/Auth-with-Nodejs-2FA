import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { OIDCSessionService } from "./oidc-session.service";
import { Request, Response } from "express";
import { verifyOIDCParams } from "@/common/validators/oidc.validator";
import { setAuthenticationCookies } from "@/common/utils/cookie";
import { HTTPSTATUS } from "@/config/http.config";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";
import LOGIN from "@/common/enums/login-codes";

export class OIDCSessionController {
  private oidcSessionService: OIDCSessionService;
  constructor(oidcSessionService: OIDCSessionService) {
    this.oidcSessionService = oidcSessionService;
  }
  public getGoogleAuthorizationURL = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const url = await this.oidcSessionService.creteOIDCSession();
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
      res.redirect(307, url);
    }
  );
  public authenticateUser = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { code, state } = verifyOIDCParams.parse(req.query);
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.oidcSessionService.authenticateUser(code, state, req);

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
}
