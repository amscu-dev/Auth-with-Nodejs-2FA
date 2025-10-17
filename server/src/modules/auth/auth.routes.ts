import { Router } from "express";
import { authController } from "./auth.module";

// ! Initialize Router
const authRoutes = Router();

// ! Register Routes
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);

// ! Export Router
export default authRoutes;
