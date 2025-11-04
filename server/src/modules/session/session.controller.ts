import { Request, Response } from "express";
import { SessionService } from "./session.service";
import { asyncHandler } from "@/middlewares/catchAsyncHandler";
import { HTTPSTATUS } from "@/config/http.config";
import { ApiResponse } from "@/common/utils/ApiSuccessReponse";
import { NotFoundException } from "@/common/utils/catch-errors";
import { ErrorCode } from "@/common/enums/error-code.enum";
import z from "zod";
import { clearAuthenticationCookies } from "@/common/utils/cookie";
import LOGIN from "@/common/enums/login-codes";

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

      const allSessionWithCurrentSessionMarked = sessions.map((session) => {
        return {
          ...session,
          isCurrent: session._id.toString() === sessionId,
        };
      });

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
  // TODO check logic below
  public getSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const sessionId = req.sessionId;

      if (!sessionId) {
        throw new NotFoundException(
          "Session ID not found.",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      const session = await this.sessionService.findSessionById(sessionId);

      if (!session) {
        throw new NotFoundException(
          "Session not found.",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }
      const { userId: user } = session;

      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.OK,
          message: "User session retrieved successfully.",
          data: {
            user,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
  public deleteSession = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const currentUser = req.user as Express.User;
      const currentSession = req.sessionId as string;
      const sessionToDelete = z.string().parse(req.params.id);

      const session = await this.sessionService.findSessionByIdAndDelete(
        sessionToDelete,
        currentUser
      );
      if (session.id === currentSession) {
        clearAuthenticationCookies(res);
      }

      return res.status(HTTPSTATUS.OK).json(
        new ApiResponse({
          success: true,
          statusCode: HTTPSTATUS.OK,
          message: "User session successfully removed.",
          data: {
            nextStep: session.id === currentSession ? LOGIN.LOGOUT : null,
          },
          metadata: {
            requestId: req.requestId,
          },
        })
      );
    }
  );
}
