import { Location } from "@/database/models/resetPasswordLog.model";
import { UserAgent } from "@/database/models/session.model";
import mongoose from "@/database/mongoose/mongoose";
import { AsyncLocalStorage } from "async_hooks";

export type AsyncRequestContext = {
  reqId?: string;
  reqIp?: string;
  reqIpLocation?: Location;
  reqUserAgent?: UserAgent;
  reqStartTime?: number;
  reqEndpoint?: string;
  reqMethod?: string;
  reqHeaders?: Record<string, any>;
  reqPayload?: any;
  reqQueryStrings?: Record<string, any>;
  reqMfaSessionId?: mongoose.Types.ObjectId;
};

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

export const getInfoFromAsyncLocalStorage = () => {
  const reqIp = asyncLocalStorage.getStore()?.get("reqIp") as string;
  const reqIpLocation = asyncLocalStorage
    .getStore()
    ?.get("reqIpLocation") as Location;
  const reqUserAgent = asyncLocalStorage
    .getStore()
    ?.get("reqUserAgent") as UserAgent;
  const reqMfaSessionId = asyncLocalStorage
    .getStore()
    ?.get("reqMfaSessionId") as mongoose.Types.ObjectId;

  return { reqIp, reqIpLocation, reqUserAgent, reqMfaSessionId };
};
