import { Router } from "express";
import SpaceController from "../controllers/SpaceController.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.use(auth);

router.get("/", SpaceController.getAll);
router.get("/:id", SpaceController.getOne);
router.post("/", SpaceController.create);
router.patch("/:id", SpaceController.update);
router.delete("/:id", SpaceController.remove);

export default router;
