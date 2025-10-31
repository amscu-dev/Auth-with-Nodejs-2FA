import { logWithMetadata } from "@/common/utils/logWithMetadata";
import { NextFunction, Request, Response } from "express";

export function logRequestEntry(
  req: Request,
  Res: Response,
  next: NextFunction
) {
  logWithMetadata({
    level: "info",
    scope: "CONTROLLER",
    status: "STARTED",
    message: "Processing request...",
  });
  next();
}
