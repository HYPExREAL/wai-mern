import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  ArrowLeft,
  Crosshair,
  AlertTriangle,
  CheckCircle,
  Send,
  Loader2,
  Droplets,
  ChevronDown,
  Info,
} from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useReports } from "../hooks/useReports";
import type { FloodReport } from "../context/reportsContextDef";

// ── Bandar Lampung center ──────────────────────────────────────
const BANDAR_LAMPUNG: [number, number] = [-5.4294, 105.2617];

// ── Custom marker icons ────────────────────────────────────────
function makeSvgIcon(color: string, strokeColor = "#fff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="${strokeColor}" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="${strokeColor}" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

const ICONS = {
  pending: makeSvgIcon("#EAB308"),   // yellow
  verified: makeSvgIcon("#16A34A"),  // green
  rejected: makeSvgIcon("#DC2626"), // red
  user: makeSvgIcon("#3B82F6"),     // blue — user location
};

// ── Map sub-component: fly to user location ────────────────────
function FlyToUser({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => map.flyTo([lat, lng], 16, { duration: 1.2 })}
      className="absolute bottom-6 right-6 z-1000 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-flood-700 font-semibold text-sm shadow-lg border border-flood-200 hover:bg-flood-50 transition-all cursor-pointer"
    >
      <Crosshair className="w-4 h-4" />
      Lokasi Saya
    </button>
  );
}

// ── Depth options ──────────────────────────────────────────────
const DEPTH_OPTIONS: { value: FloodReport["severity"]; label: string }[] = [
  { value: "low", label: "< 30 cm (Rendah)" },
  { value: "moderate", label: "30–70 cm (Sedang)" },
  { value: "high", label: "70–150 cm (Tinggi)" },
  { value: "critical", label: "> 150 cm (Kritis)" },
];

// ── Main component ─────────────────────────────────────────────
export default function InteractiveMap() {
  const geo = useGeolocation();
  const { reports, addReport } = useReports();

  // Form state
  const [name, setName] = useState("");
  const [depth, setDepth] = useState<FloodReport["severity"] | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const accuracyOk = geo.accuracy !== null && geo.accuracy <= 10;
  const canSubmit =
    !geo.loading &&
    !geo.error &&
    accuracyOk &&
    name.trim() !== "" &&
    depth !== "" &&
    description.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || geo.latitude === null || geo.longitude === null) return;

    setSubmitting(true);
    // Simulate a tiny network delay for UX
    setTimeout(() => {
      addReport({
        title: `Laporan banjir oleh ${name.trim()}`,
        description: description.trim(),
        latitude: geo.latitude!,
        longitude: geo.longitude!,
        severity: depth as FloodReport["severity"],
        reporterName: name.trim(),
        imageUrl: undefined,
        reporterContact: undefined,
      });
      setSubmitting(false);
      setSubmitted(true);
      setName("");
      setDepth("");
      setDescription("");
      setTimeout(() => setSubmitted(false), 3000);
    }, 600);
  };

  // Memoize map center so it doesn't reset on every re-render
  const hasLocation = geo.latitude !== null && geo.longitude !== null;
  const mapCenter = useMemo<[number, number]>(
    () =>
      hasLocation
        ? [geo.latitude!, geo.longitude!]
        : BANDAR_LAMPUNG,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasLocation],
  );

  return (
    <div id="map-page" className="relative h-svh w-full flex overflow-hidden">
      {/* ── Left sidebar ──────────────────────────────────────── */}
      <aside className="relative z-20 flex flex-col w-full max-w-sm shrink-0 bg-white/70 backdrop-blur-2xl border-r border-flood-200/50 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-flood-100 px-5 py-4">
          <div className="flex items-center gap-3 mb-1">
            <Link
              to="/"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-flood-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-flood-600" />
            </Link>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-flood-500" />
              <h1 className="text-lg font-bold text-flood-900 tracking-tight">
                FloodWatch
              </h1>
            </div>
          </div>
          <p className="text-xs text-flood-500 pl-11">
            Peta Interaktif &amp; Pelaporan Banjir
          </p>
        </div>

        {/* GPS Accuracy indicator */}
        <div className="px-5 pt-4">
          <div
            className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
              geo.loading
                ? "bg-flood-50/50 border-flood-200 text-flood-600"
                : geo.error
                  ? "bg-red-50 border-red-200 text-red-700"
                  : accuracyOk
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
            }`}
          >
            {geo.loading ? (
              <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin" />
            ) : geo.error ? (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : accuracyOk ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <div>
              <span className="font-semibold block">
                {geo.loading
                  ? "Mencari lokasi GPS..."
                  : geo.error
                    ? "GPS Error"
                    : accuracyOk
                      ? "GPS Akurat"
                      : "Akurasi Rendah"}
              </span>
              <span className="text-xs opacity-80">
                {geo.loading
                  ? "Pastikan GPS aktif di perangkat Anda."
                  : geo.error
                    ? geo.error
                    : `Akurasi: ±${geo.accuracy?.toFixed(1)}m${
                        !accuracyOk
                          ? " — harus ≤10m untuk mengirim laporan."
                          : ""
                      }`}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          <h2 className="text-sm font-bold text-flood-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-flood-500" />
            Kirim Laporan Banjir
          </h2>

          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="reporter-name"
              className="text-xs font-semibold text-flood-700"
            >
              Nama Pelapor
            </label>
            <input
              id="reporter-name"
              type="text"
              placeholder="Masukkan nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-flood-200 text-sm text-flood-900 placeholder:text-flood-300 focus:outline-none focus:ring-2 focus:ring-flood-400/40 focus:border-flood-400 transition-all"
            />
          </div>

          {/* Flood Depth */}
          <div className="space-y-1.5">
            <label
              htmlFor="flood-depth"
              className="text-xs font-semibold text-flood-700"
            >
              Kedalaman Banjir
            </label>
            <div className="relative">
              <select
                id="flood-depth"
                value={depth}
                onChange={(e) =>
                  setDepth(e.target.value as FloodReport["severity"] | "")
                }
                className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-flood-200 text-sm text-flood-900 focus:outline-none focus:ring-2 focus:ring-flood-400/40 focus:border-flood-400 transition-all cursor-pointer"
              >
                <option value="" disabled>
                  Pilih kedalaman
                </option>
                {DEPTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flood-400" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-xs font-semibold text-flood-700"
            >
              Deskripsi Situasi
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Jelaskan kondisi banjir di lokasi Anda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-flood-200 text-sm text-flood-900 placeholder:text-flood-300 focus:outline-none focus:ring-2 focus:ring-flood-400/40 focus:border-flood-400 transition-all resize-none"
            />
          </div>

          {/* Coordinates display */}
          {geo.latitude !== null && geo.longitude !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-flood-50 border border-flood-100 text-xs text-flood-600">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono">
                {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-linear-to-r from-flood-500 to-flood-600 hover:from-flood-400 hover:to-flood-500 shadow-lg shadow-flood-500/20 hover:shadow-flood-500/30 cursor-pointer disabled:hover:from-flood-500 disabled:hover:to-flood-600 disabled:hover:shadow-flood-500/20"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? "Mengirim..." : "Kirim Laporan"}
          </button>

          {/* Success toast */}
          {submitted && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 animate-[fadeIn_0.3s_ease-out]">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Laporan berhasil dikirim! Menunggu verifikasi admin.
            </div>
          )}
        </form>

        {/* Report count */}
        <div className="mt-auto px-5 py-4 border-t border-flood-100 text-xs text-flood-400">
          {reports.length} laporan di peta •{" "}
          {reports.filter((r) => r.status === "pending").length} menunggu
          verifikasi
        </div>
      </aside>

      {/* ── Right map ─────────────────────────────────────────── */}
      <div className="relative flex-1 z-10">
        <MapContainer
          center={mapCenter}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User location + accuracy circle */}
          {geo.latitude !== null && geo.longitude !== null && (
            <>
              <Circle
                center={[geo.latitude, geo.longitude]}
                radius={geo.accuracy ?? 0}
                pathOptions={{
                  color: accuracyOk ? "#16A34A" : "#EAB308",
                  fillColor: accuracyOk ? "#16A34A" : "#EAB308",
                  fillOpacity: 0.1,
                  weight: 1.5,
                }}
              />
              <Marker
                position={[geo.latitude, geo.longitude]}
                icon={ICONS.user}
              >
                <Popup>
                  <strong>Lokasi Anda</strong>
                  <br />
                  Akurasi: ±{geo.accuracy?.toFixed(1)}m
                </Popup>
              </Marker>
              <FlyToUser lat={geo.latitude} lng={geo.longitude} />
            </>
          )}

          {/* Report markers */}
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={ICONS[report.status]}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <strong>{report.title}</strong>
                  <br />
                  <span className="text-xs opacity-70">
                    {report.severity.toUpperCase()} •{" "}
                    {report.status.toUpperCase()}
                  </span>
                  <br />
                  {report.description}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Fade-in keyframe */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
