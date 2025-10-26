import { NextFunction, Request, Response } from "express";
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@/common/utils/catch-errors";
import { ErrorCode } from "@/common/enums/error-code.enum";

export const requireRegularAuthMethod = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Asumăm că în `req.user` avem deja utilizatorul autentificat (din JWT middleware)
  const user = req.user as Express.User;

  if (!user) {
    throw new NotFoundException("User does not exists");
  }

  // Verificăm dacă `supportedAuthMethods` include 'regular'
  const supportsRegular =
    user.userPreferences?.supportedAuthMethods?.includes("regular");

  if (!supportsRegular) {
    throw new ForbiddenException(
      "You do not have permission to perform this action. Your account was created using a third-party provider (e.g. Google). To benefit of 2FA, please add a password-based login method in your account settings first. (choose forgot password)",
      ErrorCode.VERIFICATION_ERROR
    );
  }

  // Dacă totul e ok, continuăm
  return next();
};
