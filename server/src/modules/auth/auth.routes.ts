import { Router } from "express";
import { authController } from "./auth.module";

// ! Initialize Router
const authRoutes = Router();

// ! Register Routes
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/verify/email", authController.verifyEmail);
authRoutes.post("/password/forgot", authController.forgotPassword);

authRoutes.get("/refresh", authController.refresh);
// ! Export Router
export default authRoutes;
