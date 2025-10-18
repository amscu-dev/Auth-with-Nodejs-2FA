import { Router } from "express";
import { authController } from "./auth.module";

// ! Initialize Router
const authRoutes = Router();

// ! Register Routes
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/verify/email", authController.verifyEmail);

// ! Export Router
export default authRoutes;
