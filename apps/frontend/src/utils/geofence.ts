/**
 * Bandar Lampung & ITERA Geofencing Utility (Frontend)
 * Mengunci lokus pelaporan banjir strictly untuk wilayah Kota Bandar Lampung
 * serta koridor Kampus Institut Teknologi Sumatera (ITERA) dan sekitarnya (Lampung Selatan).
 */

export const ITERA_AREA = {
  minLat: -5.378,
  maxLat: -5.318,
  minLng: 105.280,
  maxLng: 105.375,
};

export const BANDAR_LAMPUNG_BBOX = {
  minLng: 105.17843605100006,
  maxLng: 105.375,
  minLat: -5.518265078999946,
  maxLat: -5.318,
};

let polygonCoordinates: number[][][][] | null = null;
let loadPromise: Promise<number[][][][] | null> | null = null;

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
export function isInsideIteraArea(
  lng: number | null | undefined,
  lat: number | null | undefined
): boolean {
  if (typeof lng !== "number" || typeof lat !== "number" || isNaN(lng) || isNaN(lat)) {
    return false;
  }
  return (
    lat >= ITERA_AREA.minLat &&
    lat <= ITERA_AREA.maxLat &&
    lng >= ITERA_AREA.minLng &&
    lng <= ITERA_AREA.maxLng
  );
}

/**
 * Memuat batas wilayah resmi dari /layers/batas_kota.json dan menyimpannya di memori.
 */
export async function initBandarLampungGeofence(): Promise<number[][][][] | null> {
  if (polygonCoordinates) return polygonCoordinates;
  if (typeof window === "undefined") return null;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch("/layers/batas_kota.json");
      if (!res.ok) throw new Error("HTTP error " + res.status);
      const json = await res.json();
      const feature = json.features?.[0];
      if (feature?.geometry?.type === "MultiPolygon") {
        polygonCoordinates = feature.geometry.coordinates;
      } else if (feature?.geometry?.type === "Polygon") {
        polygonCoordinates = [feature.geometry.coordinates];
      }
      return polygonCoordinates;
    } catch (err) {
      console.warn("[Geofence] Gagal memuat /layers/batas_kota.json:", err);
      return null;
    }
  })();

  return loadPromise;
}

/**
 * Memeriksa apakah koordinat [longitude, latitude] berada di dalam lokus yang diizinkan
 * (Kota Bandar Lampung ATAU Kampus ITERA & sekitarnya).
 *
 * Fast check: Jika koordinat berada di luar BBox (seperti Kotabumi, Metro, Palembang, Jakarta),
 * langsung mengembalikan `false` secara instan.
 */
export function isInsideBandarLampung(
  lng: number | null | undefined,
  lat: number | null | undefined
): boolean {
  if (typeof lng !== "number" || typeof lat !== "number" || isNaN(lng) || isNaN(lat)) {
    return false;
  }

  // 1. Fast rejection Bounding Box (Kotabumi, Lampung Utara, dll langsung terfilter)
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

  // 3. Strict polygon ray-casting jika data polygon sudah dimuat
  if (!polygonCoordinates || polygonCoordinates.length === 0) {
    // Trigger pemuatan asynchronous jika belum siap
    initBandarLampungGeofence();
    return true;
  }

  for (const polygon of polygonCoordinates) {
    const outerRing = polygon[0];
    if (outerRing && pointInRing(lng, lat, outerRing)) {
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
