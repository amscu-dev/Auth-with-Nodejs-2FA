import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { HTTPSTATUS } from "@/config/http.config";
import { AppError } from "@/common/utils/AppError";
import z from "zod";
import {
  clearAuthenticationCookies,
  REFRESH_PATH,
} from "@/common/utils/cookie";
import mongoose from "mongoose";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { UnauthorizedException } from "@/common/utils/catch-errors";
import { logWithMetadata } from "@/common/utils/logWithMetadata";

const formatZodError = (res: Response, req: Request, error: z.ZodError) => {
  const errors = error.issues.map((error) => ({
    field: error.path.join("."),
    message: error.message,
  }));
  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    success: false,
    message:
      "Validation failed, some fields in the request body did not meet the expected format or constraints.",
    errorCode: ErrorCode.VALIDATION_ERROR_INVALID_REQUEST_BODY,
    requestId: req.requestId,
    errors: errors,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.log(error);
  // ! Centralized log error
  logWithMetadata({
    level: "error",
    scope: "ERROR",
    status: "FINISHED_WITH_ERROR",
    message: error.message,
    error: error,
    metadata: {},
  });
  // ! IF ERROR IS ON REFRESH API, WE DELETE BOTH EXISTENT ACCESS AND REFRESH TOKENS
  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res);
  }

  // ! Syntax Errors (JS or JSON errors)
  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      messsage: "Invalid JSON format, please check your request body.",
      errorCode: ErrorCode.INVALID_JSON_FORMAT,
      requestId: req.requestId,
    });
  }

  // ! Validation Errors thrown by Zod
  if (error instanceof z.ZodError) {
    return formatZodError(res, req, error);
  }
  // ! === Mongoose / MongoDB Errors ===
  if (
    error instanceof mongoose.mongo.MongoServerError &&
    error.code === 11000
  ) {
    // Extragi câmpul care a cauzat conflictul
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];

    return res.status(HTTPSTATUS.CONFLICT).json({
      success: false,
      message: `Duplicate value for field "${field}"`,
      errorCode: ErrorCode.VALIDATION_ERROR_INVALID_REQUEST_BODY,
      requestId: req.requestId,
      field: field,
      value: value,
    });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    console.log(error);
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errorCode: ErrorCode.VALIDATION_ERROR_INVALID_REQUEST_BODY,
      requestId: req.requestId,
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    console.log(error);
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: "Invalid resource ID format",
      errorCode: ErrorCode.VALIDATION_ERROR_INVALID_REQUEST_BODY,
      requestId: req.requestId,
    });
  }

  if (error.errorLabels?.includes("TransientTransactionError")) {
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Transaction aborted, please retry.",
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      requestId: req.requestId,
    });
  }

  // ! check to cancel cookies NOT FOR EXPIRED ONES!
  if (error instanceof UnauthorizedException && error instanceof AppError) {
    // TODO Verifica aici logica din nou
    // if (error.errorCode !== ErrorCode.AUTH_TOKEN_EXPIRED) {
    //   clearAuthenticationCookies(res);
    // }
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      requestId: req.requestId,
    });
  }

  // ! Guard Clauses - Business or Application Logic
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      requestId: req.requestId,
    });
  }

  // ! Fallback
  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Internal Server Error",
    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
    requestId: req.requestId,
  });
};
