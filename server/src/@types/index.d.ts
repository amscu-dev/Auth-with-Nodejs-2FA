import { UserDocument } from "@/database/models/user.model";
import { Request } from "express";

declare global {
  namespace Express {
    interface User extends UserDocument {}
    interface Request {
      loginAttemptId?: string;
      sessionId?: string;
      requestId: string;
    }
  }
}

declare module "pkce-challenge" {
  export default function pkceChallenge(length?: number): {
    code_verifier: string;
    code_challenge: string;
  };
}
