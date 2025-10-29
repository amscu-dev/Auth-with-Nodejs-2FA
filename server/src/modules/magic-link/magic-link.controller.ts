import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { MagicLinkService } from "./magic-link.service";
import { Request, Response } from "express";
import { HTTPSTATUS } from "@/config/http.config";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";
import { emailSchema } from "@/common/validators/auth.validator";
import LOGIN from "@/common/enums/login-codes";
import { setAuthenticationCookies } from "@/common/utils/cookie";
import { magicLinkRegisterSchema } from "@/common/validators/magic-link.validator";

export class MagicLinkController {
  private magicLinkService: MagicLinkService;
  constructor(magicLinkService: MagicLinkService) {
    this.magicLinkService = magicLinkService;
  }
  public signUpWithMagicLink = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = magicLinkRegisterSchema.parse(req.body);
      const { isMagicLinkEmailSend, user } =
        await this.magicLinkService.signUpWithMagicLink(body);
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "We've sent a magic link to your email. Click it to successfully finish your registration process.",
          data: {
            isMagicLinkEmailSend,
            user,
            nextStep: LOGIN.CHECK_EMAIL_FOR_MAGIC_LINK,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public signInWithMagicLink = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req.body.email);

      const isMagicLinkEmailSend =
        await this.magicLinkService.signInWithMagicLink(email);
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "We've sent a magic link to your email. Click it to sign in.",
          data: {
            isMagicLinkEmailSend,
            nextStep: LOGIN.CHECK_EMAIL_FOR_MAGIC_LINK,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public resendMagicLink = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req.body.email);

      const isMagicLinkEmailSend = await this.magicLinkService.resendMagicLink(
        email
      );
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "We've sent a magic link to your email. Click it to sign in.",
          data: {
            isMagicLinkEmailSend,
            nextStep: LOGIN.CHECK_EMAIL_FOR_MAGIC_LINK,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public authenticateMagicLink = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { user, accessToken, refreshToken, mfaRequired } =
        await this.magicLinkService.authenticateUser(req);
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
