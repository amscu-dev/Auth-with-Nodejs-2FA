import { asyncLocalStorage } from "@/common/context/asyncLocalStorage";
import { NextFunction, Request, Response } from "express";

export default function addInfoAsyncLocalStorage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  asyncLocalStorage.run(new Map(), () => {
    asyncLocalStorage.getStore()?.set("requestId", req.requestId);
    asyncLocalStorage.getStore()?.set("api", req.url);
    asyncLocalStorage.getStore()?.set("payload", req.body);
    asyncLocalStorage.getStore()?.set("headers", req.headers);
    asyncLocalStorage.getStore()?.set("method", req.method);
    asyncLocalStorage.getStore()?.set("query", req.query);
    next();
  });
}
