import { Request, Response } from "express";
import { SessionService } from "./session.service";
import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { HTTPSTATUS } from "@/config/http.config";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";

export class SessionController {
  private sessionService: SessionService;
  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  public getAllSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userId = req.user?.id;
      const sessionId = req.sessionId;

      const { sessions } = await this.sessionService.getAllSession(userId);

      const allSessionWithCurrentSessionMarked = sessions.map((session) => ({
        ...session,
        isCurrent: session._id === sessionId,
      }));

      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.OK,
          message: "User sessions retrieved successfully.",
          data: {
            sessions: allSessionWithCurrentSessionMarked,
          },
          metadata: {
            count: allSessionWithCurrentSessionMarked.length,
            requestId: req.requestId,
          },
        })
      );
    }
  );
}
