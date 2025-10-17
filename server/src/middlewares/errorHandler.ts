import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { HTTPSTATUS } from "@/config/http.config";
import { AppError } from "@/common/utils/AppError";
import z from "zod";
import {
  clearAuthenticationCookies,
  REFRESH_PATH,
} from "@/common/utils/cookie";

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((error) => ({
    field: error.path.join("."),
    message: error.message,
  }));
  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation failed",
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

  // * De cercetat de ce asa?
  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res);
  }

  // ! Syntax Errors (JS or JSON errors)
  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      messsage: "Invalid JSON format, please check your request body.",
    });
  }

  // ! Validation Errors thrown by Zod
  if (error instanceof z.ZodError) {
    return formatZodError(res, error);
  }

  // ! Guard Clauses - Business or Application Logic
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      messsage: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknown error occurred",
  });
};
