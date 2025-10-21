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
import { AuthenticationException } from "@/common/utils/catch-errors";

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((error) => ({
    field: error.path.join("."),
    message: error.message,
  }));
  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation failed",
    errorCode: ErrorCode.VALIDATION_ERROR,
    errors: errors,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.error(`Error occured on: PATH : ${req.path}`, error);

  // ! IF ERROR IS ON REFRESH API, WE DELETE BOTH EXISTENT ACCESS AND REFRESH TOKENS
  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res);
    console.log("STERG COOKIER URILE DACA PICA REFRESH :", res);
  }

  // ! Syntax Errors (JS or JSON errors)
  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      messsage: "Invalid JSON format, please check your request body.",
      errorCode: ErrorCode.INVALID_FORMAT,
    });
  }

  // ! Validation Errors thrown by Zod
  if (error instanceof z.ZodError) {
    return formatZodError(res, error);
  }
  // ! === Mongoose / MongoDB Errors ===
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Validation failed",
      errorCode: ErrorCode.VALIDATION_ERROR,
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid resource ID format",
      errorCode: ErrorCode.VALIDATION_ERROR,
    });
  }

  if (error.errorLabels?.includes("TransientTransactionError")) {
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      message: "Transaction aborted, please retry.",
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
    });
  }

  // ! check to cancel cookies NOT FOR EXPIRED ONES!
  if (error instanceof AuthenticationException && error instanceof AppError) {
    if (error.errorCode !== ErrorCode.AUTH_TOKEN_EXPIRED) {
      clearAuthenticationCookies(res);
    }
    return res.status(error.statusCode).json({
      messsage: error.message,
      errorCode: error.errorCode,
    });
  }

  // ! Guard Clauses - Business or Application Logic
  if (error instanceof AppError) {
    console.log("aici");
    return res.status(error.statusCode).json({
      messsage: error.message,
      errorCode: error.errorCode,
    });
  }

  // ! Fallback
  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknown error occurred",
  });
};
