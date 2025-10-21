import SessionModel from "@/database/models/session.model";

export class SessionService {
  public async findSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId);
    return session || null;
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
}
