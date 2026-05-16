import type { Request, Response } from "express";
import Report from "../models/Report";

// Fields to exclude from list queries (base64 images are huge)
const LIST_PROJECTION = "-imageUrl -imageUrls";

// POST /api/reports (Public)
export const submitReport = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      severity,
      location,
      gps_accuracy,
      reporterName,
      reporterContact,
      imageUrl,
      imageUrls,
    } = req.body;

    // Validate location is a valid GeoJSON Point format
    if (
      !location ||
      location.type !== "Point" ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        message:
          "Lokasi tidak valid. Harus berformat GeoJSON Point dengan coordinates [longitude, latitude].",
      });
    }

    // Validate GPS Accuracy (Relaxed to 2000m for better UX and testing)
    if (typeof gps_accuracy !== "number" || gps_accuracy > 2000) {
      return res.status(400).json({
        message: "Akurasi GPS tidak memadai (harus <= 2000 meter).",
      });
    }

    const newReport = new Report({
      title,
      description,
      severity,
      status: "pending",
      location,
      gps_accuracy,
      reporterName,
      reporterContact,
      imageUrl,
      imageUrls,
    });

    await newReport.save();
    return res.status(201).json({
      message: "Laporan berhasil dikirim dan menunggu verifikasi.",
      report: newReport,
    });
  } catch (error: any) {
    console.error("Error submitting report:", error);
    return res.status(500).json({
      message: "Gagal mengirim laporan.",
      error: error.message,
    });
  }
};

// GET /api/reports/published (Public) — list without image data
export const getPublishedReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.find({ status: "approved" })
      .select(LIST_PROJECTION)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(reports);
  } catch (error: any) {
    console.error("Error fetching published reports:", error);
    return res.status(500).json({ message: "Gagal mengambil laporan publik." });
  }
};

// GET /api/reports/pending (Protected) — includes image data for admin verification
export const getPendingReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(reports);
  } catch (error: any) {
    console.error("Error fetching pending reports:", error);
    return res.status(500).json({ message: "Gagal mengambil laporan tertunda." });
  }
};

// GET /api/reports/all (Protected) — all reports for admin history, without image data
// Supports query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=approved|pending|rejected
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const { from, to, status } = req.query;
    const filter: Record<string, any> = {};

    // Date range filter on createdAt
    if (from || to) {
      filter.createdAt = {};
      if (typeof from === "string") filter.createdAt.$gte = new Date(from);
      if (typeof to === "string") {
        // End of the "to" day (23:59:59.999)
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    // Status filter
    if (typeof status === "string" && ["approved", "pending", "rejected"].includes(status)) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .select(LIST_PROJECTION)
      .sort({ createdAt: -1 })
      .lean();
    return res.json(reports);
  } catch (error: any) {
    console.error("Error fetching all reports:", error);
    return res.status(500).json({ message: "Gagal mengambil semua laporan." });
  }
};

// GET /api/reports/:id (Public) — single report WITH image data
export const getReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id).lean();

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan." });
    }

    return res.json(report);
  } catch (error: any) {
    console.error("Error fetching report:", error);
    return res.status(500).json({ message: "Gagal mengambil detail laporan." });
  }
};

// PATCH /api/reports/:id/status (Protected)
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status tidak valid. Harus 'approved' atau 'rejected'.",
      });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: "after" }
    );

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan." });
    }

    return res.json({
      message: `Status laporan berhasil diubah menjadi ${status}.`,
      report,
    });
  } catch (error: any) {
    console.error("Error updating report status:", error);
    return res.status(500).json({ message: "Gagal mengubah status laporan." });
  }
};

// DELETE /api/reports/:id (Protected)
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan." });
    }

    return res.json({ message: "Laporan berhasil dihapus." });
  } catch (error: any) {
    console.error("Error deleting report:", error);
    return res.status(500).json({ message: "Gagal menghapus laporan." });
  }
};
