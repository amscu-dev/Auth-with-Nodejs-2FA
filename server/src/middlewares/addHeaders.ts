import { NextFunction, Request, Response } from "express";

export default function addRequestHeaders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
