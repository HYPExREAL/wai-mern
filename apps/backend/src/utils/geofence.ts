import fs from "fs";
import path from "path";

/**
 * Koridor Kawasan Kampus Institut Teknologi Sumatera (ITERA) dan sekitarnya
 * (Way Huwi, Sabah Balau, Belwis, Terusan Ryacudu, Kec. Jati Agung, Kab. Lampung Selatan)
 */
export const ITERA_AREA = {
  minLat: -5.378,
  maxLat: -5.318,
  minLng: 105.280,
  maxLng: 105.375,
};

/**
 * Bounding box batas cakupan wilayah pelaporan (Kota Bandar Lampung + Koridor Kampus ITERA & sekitarnya di Lampung Selatan).
 * Digunakan untuk fast rejection koordinat di luar wilayah (seperti Kotabumi, Metro, Kalianda, dll.)
 */
export const BANDAR_LAMPUNG_BBOX = {
  minLng: 105.17843605100006,
  maxLng: 105.375,
  minLat: -5.518265078999946,
  maxLat: -5.318,
};

let polygonCoordinates: number[][][][] | null = null;

function loadCoordinates(): number[][][][] {
  if (polygonCoordinates) return polygonCoordinates;
  try {
    const filePath = path.resolve(__dirname, "../data/batas_kota.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(raw);
      const feature = json.features?.[0];
      if (feature?.geometry?.type === "MultiPolygon") {
        polygonCoordinates = feature.geometry.coordinates;
      } else if (feature?.geometry?.type === "Polygon") {
        polygonCoordinates = [feature.geometry.coordinates];
      }
    }
  } catch (err) {
    console.error("[Geofence] Gagal membaca batas_kota.json:", err);
  }
  return polygonCoordinates || [];
}

/**
 * Standard ray-casting algorithm to determine if a point [lng, lat] is inside a polygon ring
 */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const p1 = ring[i];
    const p2 = ring[j];
    if (!p1 || !p2) continue;
    const xi = p1[0]!;
    const yi = p1[1]!;
    const xj = p2[0]!;
    const yj = p2[1]!;

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Memeriksa apakah koordinat berada di area kampus ITERA & sekitarnya (Lampung Selatan).
 */
export function isInsideIteraArea(lng: number, lat: number): boolean {
  return (
    lat >= ITERA_AREA.minLat &&
    lat <= ITERA_AREA.maxLat &&
    lng >= ITERA_AREA.minLng &&
    lng <= ITERA_AREA.maxLng
  );
}

/**
 * Memvalidasi apakah koordinat [longitude, latitude] berada di dalam lokus pelaporan yang diizinkan:
 * 1. Wilayah Administratif Kota Bandar Lampung (polygon resmi batas_kota.json)
 * 2. Kawasan Kampus Institut Teknologi Sumatera (ITERA) dan sekitarnya (Lampung Selatan)
 *
 * Mengunci lokus pelaporan agar tidak menerima laporan dari luar daerah (misal Kotabumi, Metro, dll).
 *
 * @param lng Longitude (contoh: 105.2617)
 * @param lat Latitude (contoh: -5.4294)
 * @returns boolean true jika berada di dalam lokus yang diizinkan
 */
export function isInsideBandarLampung(lng: number, lat: number): boolean {
  if (typeof lng !== "number" || typeof lat !== "number" || isNaN(lng) || isNaN(lat)) {
    return false;
  }

  // 1. Fast rejection menggunakan Bounding Box gabungan
  if (
    lng < BANDAR_LAMPUNG_BBOX.minLng ||
    lng > BANDAR_LAMPUNG_BBOX.maxLng ||
    lat < BANDAR_LAMPUNG_BBOX.minLat ||
    lat > BANDAR_LAMPUNG_BBOX.maxLat
  ) {
    return false;
  }

  // 2. Cek apakah berada di koridor kampus ITERA & sekitarnya (Lampung Selatan)
  if (isInsideIteraArea(lng, lat)) {
    return true;
  }

  // 3. Strict polygon ray-casting terhadap MultiPolygon resmi batas Kota Bandar Lampung
  const multiPolygon = loadCoordinates();
  if (!multiPolygon || multiPolygon.length === 0) {
    return true; // Fallback jika file polygon tidak terbaca
  }

  for (const polygon of multiPolygon) {
    const outerRing = polygon[0];
    if (outerRing && pointInRing(lng, lat, outerRing)) {
      // Cek apakah jatuh di dalam hole (jika ada)
      let inHole = false;
      for (let h = 1; h < polygon.length; h++) {
        const holeRing = polygon[h];
        if (holeRing && pointInRing(lng, lat, holeRing)) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }

  return false;
}
