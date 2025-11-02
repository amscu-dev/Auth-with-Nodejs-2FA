import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJWT } from "@/common/strategies/access-token-jwt.strategy";

// ! Initialize Router
const authRoutes = Router();

// ! Register Routes
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/email/verify", authController.verifyEmail);
// authRoutes.post("/email/resend", authController.verifyEmail);
authRoutes.post("/password/forgot", authController.forgotPassword);
authRoutes.post("/password/reset", authController.resetPassword);
authRoutes.post("/logout", authenticateJWT, authController.logout);

authRoutes.get("/refresh", authController.refresh);
// ! Export Router
export default authRoutes;
