import { Router } from "express";
import ContentController from "../controllers/ContentController.js";
import { auth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.use(auth);

router.post("/", ContentController.create);
router.patch("/:id", ContentController.update);
router.delete("/:id", ContentController.remove);
router.post("/upload", uploadLimiter, upload.single("image"), ContentController.uploadImage);

export default router;
