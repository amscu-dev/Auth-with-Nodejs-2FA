import { asyncLocalStorage } from "@/common/context/asyncLocalStorage";
import { NextFunction, Request, Response } from "express";

export default function addInfoAsyncLocalStorage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  asyncLocalStorage.run(new Map(), () => {
    asyncLocalStorage.getStore()?.set("reqId", req.requestId);
    asyncLocalStorage.getStore()?.set("reqEndpoint", req.path);
    asyncLocalStorage.getStore()?.set("reqMethod", req.method);
    asyncLocalStorage
      .getStore()
      ?.set("reqHeaders", JSON.parse(JSON.stringify(req.headers)));
    asyncLocalStorage
      .getStore()
      ?.set("reqPayload", JSON.parse(JSON.stringify(req.body)));
    asyncLocalStorage
      .getStore()
      ?.set("reqQueryStrings", JSON.parse(JSON.stringify(req.query)));
    next();
  });
}
