import { Router } from "express";
import { sessionController } from "./session.module";

const sessionRoutes = Router();

// ! These are all protected routes(auth middleware its places in index.js)
sessionRoutes.get("/all", sessionController.getAllSession);

export default sessionRoutes;
