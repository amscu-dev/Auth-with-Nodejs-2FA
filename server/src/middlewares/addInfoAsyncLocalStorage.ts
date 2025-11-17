import { asyncLocalStorage } from "@/common/context/asyncLocalStorage";
import { Location } from "@/database/models/resetPasswordLog.model";
import { UserAgent } from "@/database/models/session.model";
import { NextFunction, Request, Response } from "express";
import geoip from "geoip-lite";
import useragent from "express-useragent";

const getGeolocationForIp = (ip: string | string[] | undefined): Location => {
  const targetIp = Array.isArray(ip) ? ip[0] : ip;

  if (!targetIp) {
    return {
      ip: "unknown",
      city: "unknown",
      region: "unknown",
      country: "unknown",
      timezone: "unknown",
    };
  }

  const geoLocation = geoip.lookup(targetIp);

  return {
    ip: targetIp,
    city: geoLocation?.city || "unknown",
    region: geoLocation?.region || "unknown",
    country: geoLocation?.country || "unknown",
    timezone: geoLocation?.timezone || "unknown",
  };
};

const getParsedUserAgent = (uaHeader: string | undefined): UserAgent => {
  if (!uaHeader) {
    return {
      browser: "unknown",
      version: "unknown",
      os: "unknown",
      platform: "unknown",
    };
  }
  const parsedUaHeader = useragent.parse(uaHeader);
  return {
    browser: parsedUaHeader.browser || "unknown",
    version: parsedUaHeader.version || "unknown",
    os: parsedUaHeader.os || "unknown",
    platform: parsedUaHeader.platform || "unknown",
  };
};

export default function addInfoAsyncLocalStorage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // GET DATA FROM HEADERS
  const currentRequestIpGeolocaion = getGeolocationForIp(
    req.headers["x-forwarded-for"]
  );

  const currentRequestUserAgent = getParsedUserAgent(req.headers["user-agent"]);

  // LOAD DATA INTO ASYNC STORAGE
  asyncLocalStorage.run(new Map(), () => {
    asyncLocalStorage.getStore()?.set("reqId", req.requestId);
    asyncLocalStorage
      .getStore()
      ?.set("reqIpLocation", currentRequestIpGeolocaion);
    asyncLocalStorage.getStore()?.set("reqIp", currentRequestIpGeolocaion.ip);
    asyncLocalStorage.getStore()?.set("reqUserAgent", currentRequestUserAgent);
    asyncLocalStorage.getStore()?.set("reqStartTime", Date.now());
    asyncLocalStorage.getStore()?.set("reqEndpoint", req.path);
    asyncLocalStorage.getStore()?.set("reqMethod", req.method);
    if (req.headers) {
      asyncLocalStorage
        .getStore()
        ?.set("reqHeaders", JSON.parse(JSON.stringify(req.headers)));
    }
    if (req.body) {
      asyncLocalStorage
        .getStore()
        ?.set("reqPayload", JSON.parse(JSON.stringify(req.body)));
    }
    if (req.query) {
      asyncLocalStorage
        .getStore()
        ?.set("reqQueryStrings", JSON.parse(JSON.stringify(req.query)));
    }
    next();
  });
}
