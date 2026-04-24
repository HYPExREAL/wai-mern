import type { Request, Response } from "express";
import Report from "../models/Report";

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

    // Validate GPS Accuracy
    if (typeof gps_accuracy !== "number" || gps_accuracy > 10) {
      return res.status(400).json({
        message: "Akurasi GPS tidak memadai (harus <= 10 meter).",
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

// GET /api/reports/published (Public)
export const getPublishedReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .lean();

    const reportsWithColor = reports.map((report) => {
      let markerColor = "default";
      if (report.createdAt) {
        const month = report.createdAt.getMonth(); // 0-indexed: 2 is March, 3 is April
        if (month === 2) markerColor = "blue";
        else if (month === 3) markerColor = "red";
      }

      return {
        ...report,
        markerColor,
      };
    });

    return res.json(reportsWithColor);
  } catch (error: any) {
    console.error("Error fetching published reports:", error);
    return res.status(500).json({ message: "Gagal mengambil laporan publik." });
  }
};

// GET /api/reports/pending (Protected)
export const getPendingReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.find({ status: "pending" }).sort({ createdAt: -1 });
    return res.json(reports);
  } catch (error: any) {
    console.error("Error fetching pending reports:", error);
    return res.status(500).json({ message: "Gagal mengambil laporan tertunda." });
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
      { new: true }
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
