import { HTTPSTATUS, HttpStatusCode } from "@/config/http.config";
import { ErrorCode } from "@/common/enums/error-code.enum";
import { AppError } from "./AppError";

export class NotFoundException extends AppError {
  constructor(message = "Resource not found", errorCode?: ErrorCode) {
    super(
      message,
      HTTPSTATUS.NOT_FOUND,
      errorCode || ErrorCode.RESOURCE_NOT_FOUND
    );
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad Request", errorCode?: ErrorCode) {
    super(message, HTTPSTATUS.BAD_REQUEST, errorCode);
  }
}

export class ConflictException extends AppError {
  constructor(
    message = "Resource already exists or action conflicts with current state.",
    errorCode?: ErrorCode
  ) {
    super(message, HTTPSTATUS.CONFLICT, errorCode);
  }
}

export class ForbiddenException extends AppError {
  constructor(
    message = "You do not have permission to perform this action.",
    errorCode?: ErrorCode
  ) {
    super(message, HTTPSTATUS.FORBIDDEN, errorCode);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized Access", errorCode?: ErrorCode) {
    super(
      message,
      HTTPSTATUS.UNAUTHORIZED,
      errorCode || ErrorCode.ACCESS_UNAUTHORIZED
    );
  }
}

export class InternalServerException extends AppError {
  constructor(message = "Internal Server Error", errorCode?: ErrorCode) {
    super(
      message,
      HTTPSTATUS.INTERNAL_SERVER_ERROR,
      errorCode || ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

export class HttpException extends AppError {
  constructor(
    message = "Http Exception Error",
    statusCode: HttpStatusCode,
    errorCode?: ErrorCode
  ) {
    super(message, statusCode, errorCode);
  }
}

export class TooManyRequestsException extends AppError {
  constructor(
    message = "Too many requests. Please try again later.",
    errorCode?: ErrorCode
  ) {
    super(
      message,
      HTTPSTATUS.TOO_MANY_REQUESTS,
      errorCode || ErrorCode.TOO_MANY_REQUESTS
    );
  }
}

export class ServiceUnavaibleException extends AppError {
  constructor(
    message: string = "Failed to send the email. Please try again later.",
    errorCode?: ErrorCode
  ) {
    super(message, HTTPSTATUS.SERVICE_UNAVAILABLE, errorCode);
  }
}
