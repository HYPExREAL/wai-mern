import * as XLSX from "xlsx";
import type { FloodReport } from "../context/reportsContextDef";

// ── Shared helpers ──────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reportToRow(report: FloodReport) {
  return {
    "Nama Pelapor": report.reporterName || "Anonim",
    "Judul": report.title,
    "Deskripsi": report.description,
    "Kedalaman": report.severity,
    "Status": report.status,
    "Latitude": report.latitude,
    "Longitude": report.longitude,
    "Tanggal": formatDate(report.createdAt),
  };
}

// ── CSV Export ──────────────────────────────────────────────────

export function exportToCSV(reports: FloodReport[], filename = "laporan-banjir") {
  if (reports.length === 0) return;

  const rows = reports.map(reportToRow);
  const headers = Object.keys(rows[0]!);
  const csvLines = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h as keyof typeof row] ?? "");
        // Escape commas and quotes
        return val.includes(",") || val.includes('"')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

// ── XLSX Export ─────────────────────────────────────────────────

export function exportToXLSX(reports: FloodReport[], filename = "laporan-banjir") {
  if (reports.length === 0) return;

  const rows = reports.map(reportToRow);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colWidths = Object.keys(rows[0]!).map(key => ({
    wch: Math.max(
      key.length,
      ...rows.map(r => String(r[key as keyof typeof r] ?? "").length)
    ) + 2,
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Banjir");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── GeoJSON Export ──────────────────────────────────────────────

export function exportToGeoJSON(reports: FloodReport[], filename = "laporan-banjir") {
  if (reports.length === 0) return;

  const geojson = {
    type: "FeatureCollection" as const,
    features: reports.map(report => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [report.longitude, report.latitude],
      },
      properties: {
        id: report.id,
        title: report.title,
        description: report.description,
        reporterName: report.reporterName,
        severity: report.severity,
        status: report.status,
        createdAt: new Date(report.createdAt).toISOString(),
      },
    })),
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
  triggerDownload(blob, `${filename}.geojson`);
}
