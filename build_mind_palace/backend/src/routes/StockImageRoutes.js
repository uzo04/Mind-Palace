import { Router } from "express";
import StockImageController from "../controllers/StockImageController.js";
import { auth } from "../middleware/auth.js";

const router = Router();


router.get("/", StockImageController.getAll);
router.get("/:id/file", StockImageController.getFile);

export default router;
