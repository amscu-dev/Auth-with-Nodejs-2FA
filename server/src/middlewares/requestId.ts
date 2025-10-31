import { asyncLocalStorage } from "@/common/context/asyncLocalStorage";
import { generateUniqueCode } from "@/common/utils/uuid";
import { NextFunction, Request, Response } from "express";

export default function addRequestId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.requestId = generateUniqueCode();
  next();
}
