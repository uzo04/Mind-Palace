import { Router } from "express";
import SyncController from "../controllers/SyncController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.use(auth);
router.get("/state", SyncController.state);

export default router;
