import { Router } from "express";
import multer from "multer";
import path from "path";
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

const ALLOWED_EXTENSIONS = [".geojson", ".json", ".zip", ".kml", ".kmz", ".gpx", ".csv"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Format file "${ext}" tidak didukung. Format yang didukung: ${ALLOWED_EXTENSIONS.join(", ")}`));
    }
  },
});

router.get("/", getLayers);
router.get("/:id", getLayerById);

router.post("/", authMiddleware, createLayer);
router.post("/upload", authMiddleware, upload.single("file"), uploadLayer);
router.patch("/:id", authMiddleware, updateLayer);
router.delete("/:id", authMiddleware, deleteLayer);

export default router;
