import { Router } from "express";
import {
  submitReport,
  getPublishedReports,
  getPendingReports,
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.post("/", submitReport);
router.get("/published", getPublishedReports);

// Protected routes (Admin only) — must be before /:id to avoid route conflicts
router.get("/pending", authMiddleware, getPendingReports);
router.get("/all", authMiddleware, getAllReports);
router.patch("/:id/status", authMiddleware, updateReportStatus);
router.delete("/:id", authMiddleware, deleteReport);

// Single report detail (public, for on-demand image loading)
router.get("/:id", getReportById);

export default router;
