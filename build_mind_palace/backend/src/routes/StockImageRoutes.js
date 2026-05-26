import { Router } from "express";
import StockImageController from "../controllers/StockImageController.js";
import { auth } from "../middleware/auth.js";

const router = Router();


router.get("/", StockImageController.getAll);

export default router;