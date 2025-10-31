import { asyncLocalStorage } from "../context/asyncLocalStorage";
import logger from "../logger/logger";

type LogScope = "CONTROLLER" | "DB" | "ERROR" | "EXTERNAL_SERVICE_ERROR";
type LogLevel = "info" | "warn" | "error";
type LogStatus = "STARTED" | "FINISHED_WITH_SUCCESS" | "FINISHED_WITH_ERROR";

export function logWithMetadata({
  level,
  scope,
  status,
  message,
  metadata,
  error,
}: {
  level: LogLevel;
  scope: LogScope;
  message: string;
  status?: LogStatus;
  error?: any;
  metadata?: Record<string, any>;
}) {
  // ! Get req metadata
  const reqId = asyncLocalStorage.getStore()?.get("reqId");
  const reqUserId = asyncLocalStorage.getStore()?.get("reqUserId") || "ANONYM";
  const reqEndpoint = asyncLocalStorage.getStore()?.get("reqEndpoint");
  const reqMethod = asyncLocalStorage.getStore()?.get("reqMethod");
  const reqQueryStrings = asyncLocalStorage.getStore()?.get("reqQueryStrings");
  const reqHeaders = asyncLocalStorage.getStore()?.get("reqHeaders");
  const reqPayload = asyncLocalStorage.getStore()?.get("reqPayload");

  // ! Construct child
  const loggerChild = logger.child({
    reqId,
    reqUserId,
    reqEndpoint,
    reqMethod,
    reqQueryStrings,
    reqHeaders,
    reqPayload,
    scope,
    status,
    errorMsg: error ? (error as any)?.message : undefined,
    errorCode: error ? (error as any)?.errorCode : undefined,
    errorStack: error ? (error as any)?.stack : undefined,
    ...metadata,
  });
  if (level === "info") {
    loggerChild.info(message);
  } else if (level === "warn") {
    loggerChild.warn(message);
  } else {
    loggerChild.error(message);
  }
}
