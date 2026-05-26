import { Router } from "express";
import LocationController from "../controllers/LocationController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.use(auth);

router.post("/", LocationController.create);
router.patch("/reorder", LocationController.reorder);
router.patch("/:id", LocationController.update);
router.delete("/:id", LocationController.remove);

export default router;
