import SessionModel from "@/database/models/session.model";

export class SessionService {
  public async findSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId);
    return session || null;
  }
}
