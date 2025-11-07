import { Router } from "express";
import { authController } from "./auth.module";
import { AuthenticateAccessJWTToken } from "@/common/strategies/access-token-jwt.strategy";
import { AuthenticateRefreshJWTToken } from "@/common/strategies/refresh-token-jwt.strategy";

// ! Initialize Router
const authRoutes = Router();

// ! Register Routes
authRoutes.post("/signup", authController.register);
authRoutes.post("/signin", authController.login);
authRoutes.post("/email/verify", authController.verifyEmail);
authRoutes.post("/email/resend", authController.resendEmail);
authRoutes.post("/email/check", authController.checkEmail);
authRoutes.post("/password/forgot", authController.forgotPassword);
authRoutes.patch("/password/reset", authController.resetPassword);
authRoutes.post("/logout", AuthenticateAccessJWTToken, authController.logout);

authRoutes.get("/refresh", AuthenticateRefreshJWTToken, authController.refresh);
// ! Export Router
export default authRoutes;
