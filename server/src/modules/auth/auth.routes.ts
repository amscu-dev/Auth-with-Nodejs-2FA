import { Router } from "express";
import { authController } from "./auth.module";

// ! Initialize Router
const authRoutes = Router();

// ! Register Routes
authRoutes.post("/register", authController.register);

// ! Export Router
export default authRoutes;
