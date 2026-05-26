import { Router } from "express";
import ProgressController from "../controllers/ProgressController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.use(auth);

router.get("/dashboard", ProgressController.dashboard);
router.get("/:spaceId/quiz", ProgressController.quiz);
router.get("/:spaceId", ProgressController.get);
router.patch("/:spaceId", ProgressController.update);

export default router;
