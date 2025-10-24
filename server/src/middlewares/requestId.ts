import { generateUniqueCode } from "@/common/utils/uuid";
import { NextFunction, Request, Response } from "express";

export default function addRequestId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = generateUniqueCode();
  req.requestId = requestId;
  res.setHeader("X-Powered-By", "MERN_AUTH_DEMO");
  res.setHeader("X-Request-Id", requestId);
  next();
}
