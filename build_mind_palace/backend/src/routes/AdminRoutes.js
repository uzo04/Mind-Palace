import { Router } from "express";
import AdminController from "../controllers/AdminController.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

router.use(auth, requireRole("admin"));

router.get("/overview", AdminController.getOverview);
router.get("/users", AdminController.getUsers);
router.post("/users", AdminController.createUser);
router.patch("/users/:id/role", AdminController.updateUserRole);
router.patch("/users/:id", AdminController.updateUser);
router.delete("/users/:id", AdminController.deleteUser);
router.get("/users/:id/spaces", AdminController.getUserSpaces);
router.patch("/spaces/:id", AdminController.updateSpace);
router.delete("/spaces/:id", AdminController.deleteSpace);
router.patch("/locations/:id", AdminController.updateLocation);
router.delete("/locations/:id", AdminController.deleteLocation);
router.patch("/contents/:id", AdminController.updateContent);
router.delete("/contents/:id", AdminController.deleteContent);
router.get("/images", AdminController.getImages);
router.post("/images", AdminController.createImage);
router.delete("/images/:id", AdminController.deleteImage);

export default router;
