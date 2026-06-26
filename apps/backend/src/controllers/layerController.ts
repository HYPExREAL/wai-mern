import type { Request, Response } from "express";
import SpatialLayer from "../models/SpatialLayer";
import { convertToGeoJSON, getSupportedFormats } from "../utils/geoConverter";

// List projection — exclude geoData from list queries (it can be huge)
const LIST_PROJECTION = "-geoData";

// GET /api/layers (Public) — list all layers (metadata only, no geoData)
export const getLayers = async (req: Request, res: Response) => {
  try {
    const { publicOnly } = req.query;
    const filter = publicOnly === "true" ? { isPublic: true } : {};
    const layers = await SpatialLayer.find(filter)
      .select(LIST_PROJECTION)
      .sort({ createdAt: -1 })
      .lean();
    return res.json(layers);
  } catch (error: any) {
    console.error("Error fetching layers:", error);
    return res.status(500).json({ message: "Gagal mengambil daftar layer." });
  }
};

// GET /api/layers/:id (Public) — single layer WITH full geoData
export const getLayerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const layer = await SpatialLayer.findById(id).lean();
    if (!layer) {
      return res.status(404).json({ message: "Layer tidak ditemukan." });
    }
    return res.json(layer);
  } catch (error: any) {
    console.error("Error fetching layer:", error);
    return res.status(500).json({ message: "Gagal mengambil detail layer." });
  }
};

// POST /api/layers (Admin) — create a new layer (raw JSON body, backward compat)
export const createLayer = async (req: Request, res: Response) => {
  try {
    const { name, description, fileName, geoData, style, isPublic } = req.body;

    if (!name || !geoData) {
      return res.status(400).json({ message: "Nama dan data GeoJSON wajib diisi." });
    }

    const layer = new SpatialLayer({
      name,
      description: description || "",
      fileName: fileName || "upload.geojson",
      geoData,
      style: style || {},
      isPublic: isPublic ?? false,
    });

    await layer.save();
    
    // Return without geoData to keep response small
    const saved = layer.toObject();
    const { geoData: _, ...withoutGeo } = saved;
    return res.status(201).json({
      message: "Layer berhasil ditambahkan.",
      layer: withoutGeo,
    });
  } catch (error: any) {
    console.error("Error creating layer:", error);
    return res.status(500).json({ message: "Gagal menambahkan layer." });
  }
};

// POST /api/layers/upload (Admin) — upload a spatial file (multipart/form-data)
export const uploadLayer = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({
        message: "File wajib diunggah.",
        supportedFormats: getSupportedFormats(),
      });
    }

    const { name, color, isPublic } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nama layer wajib diisi." });
    }

    // Convert file to GeoJSON
    const result = await convertToGeoJSON(file.buffer, file.originalname);

    // Build style
    const style = {
      color: color || "#3B82F6",
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.1,
    };

    // Save to DB
    const layer = new SpatialLayer({
      name: name.trim(),
      description: `Diimpor dari ${result.detectedFormat} (${result.featureCount} fitur)`,
      fileName: file.originalname,
      geoData: result.geojson,
      style,
      isPublic: isPublic === "true" || isPublic === true,
    });

    await layer.save();

    const saved = layer.toObject();
    const { geoData: _, ...withoutGeo } = saved;

    return res.status(201).json({
      message: "Layer berhasil diimpor!",
      layer: withoutGeo,
      conversion: {
        detectedFormat: result.detectedFormat,
        featureCount: result.featureCount,
        geometryTypes: result.geometryTypes,
      },
    });
  } catch (error: any) {
    console.error("Error uploading layer:", error);
    const message = error.message || "Gagal mengimpor layer.";
    return res.status(400).json({ message });
  }
};

// PATCH /api/layers/:id (Admin) — update layer metadata/style
export const updateLayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, style, isPublic } = req.body;

    const update: Record<string, any> = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (style !== undefined) update.style = style;
    if (isPublic !== undefined) update.isPublic = isPublic;

    const layer = await SpatialLayer.findByIdAndUpdate(id, update, { returnDocument: "after" })
      .select(LIST_PROJECTION)
      .lean();

    if (!layer) {
      return res.status(404).json({ message: "Layer tidak ditemukan." });
    }

    return res.json({ message: "Layer berhasil diperbarui.", layer });
  } catch (error: any) {
    console.error("Error updating layer:", error);
    return res.status(500).json({ message: "Gagal memperbarui layer." });
  }
};

// DELETE /api/layers/:id (Admin)
export const deleteLayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const layer = await SpatialLayer.findByIdAndDelete(id);
    if (!layer) {
      return res.status(404).json({ message: "Layer tidak ditemukan." });
    }
    return res.json({ message: "Layer berhasil dihapus." });
  } catch (error: any) {
    console.error("Error deleting layer:", error);
    return res.status(500).json({ message: "Gagal menghapus layer." });
  }
};

