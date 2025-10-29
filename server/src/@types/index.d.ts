import { UserDocument } from "@/database/models/user.model";
import { Request } from "express";
import { MagicLinkSessionDocument } from "@/database/models/magicLinkSession.model";
declare global {
  namespace Express {
    interface User extends UserDocument {}
    interface Request {
      loginAttemptId?: string;
      sessionId?: string;
      requestId: string;
      magicLinkSession?: MagicLinkSessionDocument;
    }
    interface MagicLinkSession extends MagicLinkSessionDocument {}
  }
}
