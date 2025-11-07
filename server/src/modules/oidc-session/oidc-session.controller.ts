import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { OIDCSessionService } from "./oidc-session.service";
import { Request, Response } from "express";
import { verifyOIDCParams } from "@/common/validators/oidc.validator";
import { setAuthenticationCookies } from "@/common/utils/cookie";
import { HTTPSTATUS } from "@/config/http.config";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";
import LOGIN from "@/common/enums/login-codes";
import {
  getGithubAuthorizationURL,
  getGoogleAuthorizationURL,
} from "@/common/utils/oauth";

export class OIDCSessionController {
  private oidcSessionService: OIDCSessionService;
  constructor(oidcSessionService: OIDCSessionService) {
    this.oidcSessionService = oidcSessionService;
  }
  public getGoogleAuthorizationURL = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { state, codeChallenge } =
        await this.oidcSessionService.createOIDCSession("google");
      const url = getGoogleAuthorizationURL({ state, codeChallenge });
      res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message: "Successfully genereated an OIDC session!",
          data: { url },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public getGithubAuthorizationURL = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { state, codeChallenge } =
        await this.oidcSessionService.createOIDCSession("github");
      const url = getGithubAuthorizationURL({ state, codeChallenge });

      res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message: "Successfully genereated an OIDC session!",
          data: { url },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public authenticateGoogleUser = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { code, state } = verifyOIDCParams.parse(req.query);
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.oidcSessionService.authenticateGoogleUser(code, state, req);

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
  public authenticateGithubUser = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { code, state } = verifyOIDCParams.parse(req.query);
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.oidcSessionService.authenticateGithubUser(code, state, req);

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
