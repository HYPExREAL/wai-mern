import { Router } from "express";
import {
  submitReport,
  getPublishedReports,
  getPendingReports,
  updateReportStatus,
} from "../controllers/reportController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.post("/", submitReport);
router.get("/published", getPublishedReports);

// Protected routes (Admin only)
router.get("/pending", authMiddleware, getPendingReports);
router.patch("/:id/status", authMiddleware, updateReportStatus);

export default router;
