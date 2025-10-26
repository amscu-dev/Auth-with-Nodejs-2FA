import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { MagicLinkService } from "./magic-link.service";
import { Request, Response } from "express";
import { HTTPSTATUS } from "@/config/http.config";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";
import { emailSchema } from "@/common/validators/auth.validator";

export class MagicLinkController {
  private magicLinkService: MagicLinkService;
  constructor(magicLinkService: MagicLinkService) {
    this.magicLinkService = magicLinkService;
  }
  public generateMagicLink = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req.body.email);

      const isMagicLinkEmailSend =
        await this.magicLinkService.generateMagicLink(email);
      return res.status(HTTPSTATUS.CREATED).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.CREATED,
          message:
            "We've sent a magic link to your email. Click it to sign in.",
          data: { isMagicLinkEmailSend },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public authenticateMagicLink = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      console.log(req.url);
    }
  );
}
