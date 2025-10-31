import { asyncLocalStorage } from "@/common/context/asyncLocalStorage";
import { logWithMetadata } from "@/common/utils/logWithMetadata";
import { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  logWithMetadata({
    level: "info",
    scope: "CONTROLLER",
    status: "STARTED",
    message: "Processing request...",
  });

  res.on("finish", () => {
    const startTime = asyncLocalStorage.getStore()?.get("reqStartTime");
    const reqDuration = Date.now() - startTime;
    logWithMetadata({
      level: "info",
      scope: "CONTROLLER",
      status:
        res.statusCode < 400 ? "FINISHED_WITH_SUCCESS" : "FINISHED_WITH_ERROR",
      message: "Request processed",
      metadata: {
        reqDuration,
      },
    });
  });

  next();
}
