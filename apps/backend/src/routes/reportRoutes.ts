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

router.post("/", submitReport);
router.get("/published", getPublishedReports);

router.get("/pending", authMiddleware, getPendingReports);
router.get("/all", authMiddleware, getAllReports);
router.patch("/:id/status", authMiddleware, updateReportStatus);
router.delete("/:id", authMiddleware, deleteReport);

router.get("/:id", getReportById);

export default router;
