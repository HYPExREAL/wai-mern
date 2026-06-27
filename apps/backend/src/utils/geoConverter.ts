/**
 * geoConverter.ts
 * 
 * Server-side utility to convert various WebGIS file formats into GeoJSON.
 * Supports: GeoJSON, Shapefile (ZIP), KML, KMZ, GPX, CSV (with lat/lng columns).
 * 
 * All outputs are normalized to EPSG:4326 (WGS84) FeatureCollections.
 */

import AdmZip from "adm-zip";
// @ts-ignore — shapefile has no type declarations
import * as shapefile from "shapefile";
import proj4 from "proj4";
import { DOMParser } from "@xmldom/xmldom";
import * as toGeoJSON from "@tmcw/togeojson";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ── Projection helpers ─────────────────────────────────────────

/** Common projections we can detect from .prj content */
const KNOWN_PROJECTIONS: Record<string, string> = {
  "EPSG:3857": "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs",
  "EPSG:32748": "+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs",
  "EPSG:32749": "+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs",
  "EPSG:23848": "+proj=utm +zone=48 +ellps=evrst30 +towgs84=-11,851,5,0,0,0,0 +units=m +no_defs",
};

const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

/**
 * Try to detect projection from .prj file content.
 * Returns a proj4 string or null if unrecognized.
 */
function detectProjection(prjContent: string): string | null {
  const upper = prjContent.toUpperCase();

  // Check for Web Mercator indicators
  if (upper.includes("WEB_MERCATOR") || upper.includes("PSEUDO_MERCATOR") ||
      upper.includes("3857") || upper.includes("900913") ||
      (upper.includes("MERCATOR") && upper.includes("6378137"))) {
    return KNOWN_PROJECTIONS["EPSG:3857"]!;
  }

  // Check for UTM zone indicators
  const utmMatch = upper.match(/UTM.*ZONE\s*(\d+)/);
  if (utmMatch) {
    const zone = parseInt(utmMatch[1]!);
    const south = upper.includes("SOUTH") || upper.includes("S");
    return `+proj=utm +zone=${zone} ${south ? "+south " : ""}+datum=WGS84 +units=m +no_defs`;
  }

  // If it's already WGS84 / GCS, no reprojection needed
  if (upper.includes("WGS_1984") || upper.includes("WGS 84") || upper.includes("WGS84")) {
    if (!upper.includes("UTM") && !upper.includes("MERCATOR") && !upper.includes("PROJECTED")) {
      return null; // Already in lat/lng
    }
  }

  return null;
}

/**
 * Check if coordinates look like they need reprojection.
 * WGS84 coords: lng [-180, 180], lat [-90, 90]
 * Projected coords: values in the millions (meters)
 */
function needsReprojection(geojson: any): boolean {
  const coords = extractSampleCoords(geojson, 5);
  if (coords.length === 0) return false;

  return coords.some(([x, y]) =>
    Math.abs(x!) > 180 || Math.abs(y!) > 90
  );
}

function extractSampleCoords(geojson: any, max: number): number[][] {
  const coords: number[][] = [];

  function walk(c: any) {
    if (coords.length >= max) return;
    if (Array.isArray(c) && typeof c[0] === "number" && typeof c[1] === "number") {
      coords.push(c);
      return;
    }
    if (Array.isArray(c)) {
      for (const item of c) walk(item);
    }
  }

  for (const f of (geojson.features || [])) {
    if (coords.length >= max) break;
    walk(f.geometry?.coordinates);
  }
  return coords;
}

/** Reproject all coordinates in a GeoJSON from sourceProj to WGS84 */
function reprojectGeoJSON(geojson: any, sourceProj: string): any {
  function reprojectCoords(coords: any): any {
    if (Array.isArray(coords) && typeof coords[0] === "number") {
      return proj4(sourceProj, WGS84, coords as [number, number]);
    }
    if (Array.isArray(coords)) {
      return coords.map(reprojectCoords);
    }
    return coords;
  }

  const result = { ...geojson };
  result.features = (geojson.features || []).map((f: any) => ({
    ...f,
    geometry: {
      ...f.geometry,
      coordinates: reprojectCoords(f.geometry?.coordinates),
    },
  }));

  // Remove bbox since it's now invalid
  delete result.bbox;

  return result;
}

// ── Format parsers ──────────────────────────────────────────────

async function parseGeoJSON(buffer: Buffer): Promise<any> {
  const text = buffer.toString("utf-8");
  const data = JSON.parse(text);

  if (data.type === "FeatureCollection") return data;
  if (data.type === "Feature") return { type: "FeatureCollection", features: [data] };
  if (data.type && data.coordinates) {
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: data }] };
  }

  throw new Error("File bukan format GeoJSON yang valid.");
}

async function parseShapefileZip(buffer: Buffer): Promise<any> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shp-"));

  try {
    const zip = new AdmZip(buffer);
    zip.extractAllTo(tmpDir, true);

    // Recursively find files
    function findFiles(dir: string, ext: string): string[] {
      const results: string[] = [];
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (fs.statSync(full).isDirectory()) {
          results.push(...findFiles(full, ext));
        } else if (entry.toLowerCase().endsWith(ext)) {
          results.push(full);
        }
      }
      return results;
    }

    const shpFiles = findFiles(tmpDir, ".shp");
    if (shpFiles.length === 0) throw new Error("File ZIP tidak mengandung file .shp.");

    const allFeatures: any[] = [];

    for (const shpPath of shpFiles) {
      const baseName = path.basename(shpPath, ".shp");
      const baseDir = path.dirname(shpPath);

      // Find matching files
      const dbfPath = findFiles(baseDir, ".dbf")
        .find(f => path.basename(f, ".dbf").toLowerCase() === baseName.toLowerCase());
      const prjPath = findFiles(baseDir, ".prj")
        .find(f => path.basename(f, ".prj").toLowerCase() === baseName.toLowerCase());

      // Parse shapefile
      let geojson = await shapefile.read(shpPath, dbfPath || undefined);

      // Handle projection
      if (prjPath) {
        const prjContent = fs.readFileSync(prjPath, "utf-8");
        const sourceProj = detectProjection(prjContent);

        if (sourceProj && needsReprojection(geojson)) {
          geojson = reprojectGeoJSON(geojson, sourceProj);
        }
      } else if (needsReprojection(geojson)) {
        // Default assumption: Web Mercator
        geojson = reprojectGeoJSON(geojson, KNOWN_PROJECTIONS["EPSG:3857"]!);
      }

      if (geojson && geojson.features) {
        allFeatures.push(...geojson.features);
      }
    }

    return {
      type: "FeatureCollection",
      features: allFeatures,
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function parseKML(buffer: Buffer): any {
  const text = buffer.toString("utf-8");
  const dom = new DOMParser().parseFromString(text, "text/xml");
  const geojson = toGeoJSON.kml(dom);

  if (!geojson.features || geojson.features.length === 0) {
    throw new Error("File KML kosong atau tidak mengandung fitur.");
  }

  return geojson;
}

function parseKMZ(buffer: Buffer): any {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const kmlEntry = entries.find(e => e.entryName.toLowerCase().endsWith(".kml"));

  if (!kmlEntry) throw new Error("File KMZ tidak mengandung file .kml.");

  return parseKML(kmlEntry.getData());
}

function parseGPX(buffer: Buffer): any {
  const text = buffer.toString("utf-8");
  const dom = new DOMParser().parseFromString(text, "text/xml");
  const geojson = toGeoJSON.gpx(dom);

  if (!geojson.features || geojson.features.length === 0) {
    throw new Error("File GPX kosong atau tidak mengandung fitur.");
  }

  return geojson;
}

function parseCSV(buffer: Buffer): any {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error("File CSV kosong atau hanya memiliki header.");

  const headers = lines[0]!.split(",").map(h => h.trim().toLowerCase());

  // Find lat/lng columns
  const latIdx = headers.findIndex(h => 
    ["latitude", "lat", "y", "lintang"].includes(h)
  );
  const lngIdx = headers.findIndex(h => 
    ["longitude", "lng", "lon", "long", "x", "bujur"].includes(h)
  );

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error(
      "File CSV harus memiliki kolom latitude/lat dan longitude/lng. " +
      `Kolom yang ditemukan: ${headers.join(", ")}`
    );
  }

  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(",").map(c => c.trim());
    const lat = parseFloat(cols[latIdx] || "");
    const lng = parseFloat(cols[lngIdx] || "");

    if (isNaN(lat) || isNaN(lng)) continue;

    const properties: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (idx !== latIdx && idx !== lngIdx) {
        properties[h] = cols[idx] || "";
      }
    });

    features.push({
      type: "Feature" as const,
      properties,
      geometry: {
        type: "Point" as const,
        coordinates: [lng, lat],
      },
    });
  }

  if (features.length === 0) {
    throw new Error("Tidak ada data koordinat valid yang ditemukan dalam CSV.");
  }

  return { type: "FeatureCollection", features };
}

// ── Main converter ──────────────────────────────────────────────

/** Detect format from filename and parse content into GeoJSON FeatureCollection */
async function parseByFormat(buffer: Buffer, filename: string): Promise<any> {
  const ext = path.extname(filename).toLowerCase();

  switch (ext) {
    case ".geojson":
    case ".json":
      return parseGeoJSON(buffer);

    case ".zip":
      return parseZipContent(buffer);

    case ".kml":
      return parseKML(buffer);

    case ".kmz":
      return parseKMZ(buffer);

    case ".gpx":
      return parseGPX(buffer);

    case ".csv":
      return parseCSV(buffer);

    default:
      throw new Error(
        `Format file "${ext}" tidak didukung. ` +
        `Format yang didukung: .geojson, .json, .zip (Shapefile), .kml, .kmz, .gpx, .csv`
      );
  }
}

/** Smart ZIP handler — peeks inside to determine if it's a Shapefile, KML, or GeoJSON archive */
async function parseZipContent(buffer: Buffer): Promise<any> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const names = entries.map(e => e.entryName.toLowerCase());

  // Check what's inside
  const hasShp = names.some(n => n.endsWith(".shp"));
  const hasKml = names.some(n => n.endsWith(".kml"));
  const hasGeoJson = names.some(n => n.endsWith(".geojson") || n.endsWith(".json"));

  if (hasShp) return parseShapefileZip(buffer);
  if (hasKml) {
    const kmlEntry = entries.find(e => e.entryName.toLowerCase().endsWith(".kml"))!;
    return parseKML(kmlEntry.getData());
  }
  if (hasGeoJson) {
    const geoEntry = entries.find(e => {
      const n = e.entryName.toLowerCase();
      return n.endsWith(".geojson") || n.endsWith(".json");
    })!;
    return parseGeoJSON(geoEntry.getData());
  }

  throw new Error(
    "File ZIP tidak mengandung format yang dikenali (.shp, .kml, atau .geojson). " +
    "Pastikan ZIP berisi file Shapefile (.shp + .dbf + .shx) atau file KML."
  );
}

// ── Validation ──────────────────────────────────────────────────

function validateGeoJSON(geojson: any): void {
  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("Hasil konversi bukan FeatureCollection yang valid.");
  }

  if (!Array.isArray(geojson.features) || geojson.features.length === 0) {
    throw new Error("File tidak mengandung fitur spasial.");
  }

  // Check sample coords are within valid WGS84 range
  const coords = extractSampleCoords(geojson, 10);
  const invalid = coords.find(([x, y]) => Math.abs(x!) > 180 || Math.abs(y!) > 90);
  if (invalid) {
    throw new Error(
      `Koordinat di luar jangkauan WGS84 (lng: ${invalid[0]?.toFixed(2)}, lat: ${invalid[1]?.toFixed(2)}). ` +
      `File mungkin menggunakan proyeksi yang tidak dikenali.`
    );
  }
}

// ── Public API ──────────────────────────────────────────────────

export interface ConversionResult {
  geojson: any;
  featureCount: number;
  geometryTypes: string[];
  detectedFormat: string;
}

/**
 * Convert any supported WebGIS file buffer into a validated GeoJSON FeatureCollection.
 * Handles format detection, parsing, projection handling, and validation.
 */
export async function convertToGeoJSON(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const ext = path.extname(filename).toLowerCase();

  // Determine detected format label
  let detectedFormat = "Unknown";
  if ([".geojson", ".json"].includes(ext)) detectedFormat = "GeoJSON";
  else if (ext === ".zip") detectedFormat = "ZIP Archive";
  else if (ext === ".kml") detectedFormat = "KML";
  else if (ext === ".kmz") detectedFormat = "KMZ";
  else if (ext === ".gpx") detectedFormat = "GPX";
  else if (ext === ".csv") detectedFormat = "CSV";

  // Parse
  const geojson = await parseByFormat(buffer, filename);

  // Validate
  validateGeoJSON(geojson);

  // Collect stats
  const geometryTypes = [...new Set(
    geojson.features.map((f: any) => f.geometry?.type).filter(Boolean)
  )] as string[];

  // If ZIP contained shapefile, update detected format
  if (ext === ".zip") {
    const zip = new AdmZip(buffer);
    const names = zip.getEntries().map(e => e.entryName.toLowerCase());
    if (names.some(n => n.endsWith(".shp"))) detectedFormat = "Shapefile (ZIP)";
    else if (names.some(n => n.endsWith(".kml"))) detectedFormat = "KML (ZIP)";
    else if (names.some(n => n.endsWith(".geojson"))) detectedFormat = "GeoJSON (ZIP)";
  }

  return {
    geojson,
    featureCount: geojson.features.length,
    geometryTypes,
    detectedFormat,
  };
}

/** Returns list of supported file extensions */
export function getSupportedFormats(): string[] {
  return [".geojson", ".json", ".zip", ".kml", ".kmz", ".gpx", ".csv"];
}
