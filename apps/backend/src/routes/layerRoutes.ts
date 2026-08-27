import { Router } from "express";
import multer from "multer";
import {
  getLayers,
  getLayerById,
  createLayer,
  uploadLayer,
  updateLayer,
  deleteLayer,
} from "../controllers/layerController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get("/", getLayers);
router.get("/:id", getLayerById);

router.post("/", authMiddleware, createLayer);
router.post("/upload", authMiddleware, upload.single("file"), uploadLayer);
router.patch("/:id", authMiddleware, updateLayer);
router.delete("/:id", authMiddleware, deleteLayer);

export default router;
