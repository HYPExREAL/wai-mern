import { Router } from "express";
import {
  getLayers,
  getLayerById,
  createLayer,
  updateLayer,
  deleteLayer,
} from "../controllers/layerController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.get("/", getLayers);
router.get("/:id", getLayerById);

// Protected routes (Admin only)
router.post("/", authMiddleware, createLayer);
router.patch("/:id", authMiddleware, updateLayer);
router.delete("/:id", authMiddleware, deleteLayer);

export default router;
