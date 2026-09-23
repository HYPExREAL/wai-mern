import type { Request, Response } from "express";
import mongoose from "mongoose";
import Report from "../models/Report";

const LIST_PROJECTION = "-imageUrl -imageUrls";

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

    if (!title || typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
      return res.status(400).json({ message: "Judul wajib diisi dan maksimal 200 karakter." });
    }

    if (!description || typeof description !== "string" || description.trim().length === 0 || description.length > 5000) {
      return res.status(400).json({ message: "Deskripsi wajib diisi dan maksimal 5000 karakter." });
    }

    if (typeof severity !== "number" || severity < 0 || severity > 1000) {
      return res.status(400).json({ message: "Kedalaman banjir harus berupa angka antara 0–1000 cm." });
    }

    if (!reporterName || typeof reporterName !== "string" || reporterName.trim().length === 0 || reporterName.length > 100) {
      return res.status(400).json({ message: "Nama pelapor wajib diisi dan maksimal 100 karakter." });
    }

    if (reporterContact !== undefined && reporterContact !== null) {
      if (typeof reporterContact !== "string" || reporterContact.length > 200) {
        return res.status(400).json({ message: "Kontak pelapor harus berupa teks maksimal 200 karakter." });
      }
    }

    const urlPattern = /^(https?:\/\/.+|data:image\/.+;base64,.+)$/;
    if (imageUrl !== undefined && imageUrl !== null && imageUrl !== "") {
      if (typeof imageUrl !== "string" || !urlPattern.test(imageUrl)) {
        return res.status(400).json({ message: "Format URL gambar tidak valid." });
      }
    }

    if (imageUrls !== undefined && imageUrls !== null) {
      if (!Array.isArray(imageUrls) || imageUrls.length > 10) {
        return res.status(400).json({ message: "Daftar gambar harus berupa array dengan maksimal 10 URL." });
      }
      for (const url of imageUrls) {
        if (typeof url !== "string" || (url !== "" && !urlPattern.test(url))) {
          return res.status(400).json({ message: "Salah satu URL gambar tidak valid." });
        }
      }
    }

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

    const [lng, lat] = location.coordinates;
    if (typeof lng !== "number" || typeof lat !== "number" ||
        lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: "Koordinat di luar jangkauan valid." });
    }

    if (typeof gps_accuracy !== "number" || gps_accuracy > 2000) {
      return res.status(400).json({
        message: "Akurasi GPS tidak memadai (harus <= 2000 meter).",
      });
    }

    const newReport = new Report({
      title: title.trim(),
      description: description.trim(),
      severity,
      status: "pending",
      location,
      gps_accuracy,
      reporterName: reporterName.trim(),
      reporterContact: reporterContact?.trim(),
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
    });
  }
};

export const getPublishedReports = async (req: Request, res: Response) => {
  try {
    const { minLng, minLat, maxLng, maxLat } = req.query;
    const filter: Record<string, any> = { status: "approved" };

    if (minLng && minLat && maxLng && maxLat) {
      filter.location = {
        $geoWithin: {
          $box: [
            [parseFloat(minLng as string), parseFloat(minLat as string)],
            [parseFloat(maxLng as string), parseFloat(maxLat as string)],
          ],
        },
      };
    }

    const reports = await Report.find(filter)
      .select(LIST_PROJECTION)
      .sort({ createdAt: -1 })
      .limit(filter.location ? 0 : 500)
      .lean();

    return res.json(reports);
  } catch (error: any) {
    console.error("Error fetching published reports:", error);
    return res.status(500).json({ message: "Gagal mengambil laporan publik." });
  }
};

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

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const { from, to, status, page = "1", limit = "10" } = req.query;
    const filter: Record<string, any> = {};

    if (from || to) {
      filter.createdAt = {};
      if (typeof from === "string") filter.createdAt.$gte = new Date(from);
      if (typeof to === "string") {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    if (typeof status === "string" && ["approved", "pending", "rejected"].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 50000);
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select(LIST_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Report.countDocuments(filter),
    ]);

    return res.json({
      data: reports,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error("Error fetching all reports:", error);
    return res.status(500).json({ message: "Gagal mengambil semua laporan." });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }
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

export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }
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

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }
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
