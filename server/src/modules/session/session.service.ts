import { ErrorCode } from "@/common/enums/error-code.enum";
import {
  NotFoundException,
  UnauthorizedException,
} from "@/common/utils/catch-errors";
import SessionModel, { SessionDocument } from "@/database/models/session.model";
import { UserDocument } from "@/database/models/user.model";
import mongoose from "mongoose";

export type PopulatedSession = SessionDocument & { userId: UserDocument };
export class SessionService {
  public async findSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId).populate<{
      userId: UserDocument;
    }>("userId");

    return session;
  }
  public async getAllSession(userId: string) {
    const sessions = await SessionModel.find(
      {
        userId,
        expiredAt: { $gt: Date.now() },
      },
      {
        sort: {
          createdAt: -1,
        },
      }
    )
      .select("_id userId userAgent")
      .lean();
    return { sessions };
  }

  public async findSessionByIdAndDelete(sessionId: string, user: Express.User) {
    const sessionToDelete = await SessionModel.findById(sessionId);

    if (!sessionToDelete) {
      throw new NotFoundException(
        "Unable to delete session: session not found."
      );
    }
    if (user.id !== sessionToDelete.userId.toString()) {
      throw new UnauthorizedException(
        "You do not have permission to perform this operation.",
        ErrorCode.ACCESS_FORBIDDEN
      );
    }
    await sessionToDelete.deleteOne();
    return sessionToDelete;
  }
}
