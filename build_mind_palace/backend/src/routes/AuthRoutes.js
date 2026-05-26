import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import { auth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);
router.get("/me", auth, AuthController.me);

export default router;
