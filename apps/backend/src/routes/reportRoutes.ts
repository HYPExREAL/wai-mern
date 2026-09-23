import { Router } from "express";
import rateLimit from "express-rate-limit";
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

const reportSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,       
  max: 5,                      
  message: { message: "Terlalu banyak laporan dikirim. Coba lagi nanti." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", reportSubmitLimiter, submitReport);
router.get("/published", getPublishedReports);

router.get("/pending", authMiddleware, getPendingReports);
router.get("/all", authMiddleware, getAllReports);
router.patch("/:id/status", authMiddleware, updateReportStatus);
router.delete("/:id", authMiddleware, deleteReport);

router.get("/:id", getReportById);

export default router;
