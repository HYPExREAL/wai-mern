import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Check, Shield, AlertCircle } from "lucide-react";
import { useReports } from "../hooks/useReports";


// ── Custom marker icons ────────────────────────────────────────
function makeSvgIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.9"/>
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
  pending: makeSvgIcon("#EAB308"), // yellow
  rejected: makeSvgIcon("#9CA3AF"), // gray
  // Dynamic published icons
  publishedBlue: makeSvgIcon("#3B82F6"), // blue
  publishedRed: makeSvgIcon("#EF4444"),  // red
};

// ── Helper to determine published color based on month ─────────
function getPublishedIcon() {
  const month = new Date().getMonth(); // 0-11
  // Use Blue for even months (Jan, Mar...), Red for odd months (Feb, Apr...)
  return month % 2 === 0 ? ICONS.publishedBlue : ICONS.publishedRed;
}

// ── Component to fly map to selected report ────────────────────
function MapUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

const BANDAR_LAMPUNG: [number, number] = [-5.4294, 105.2617];

export default function AdminDashboard() {
  const { reports, pendingReports, verifyReport, rejectReport } = useReports();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  const handleApprove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    verifyReport(id);
  };

  const handleReject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    rejectReport(id);
  };

  return (
    <div className="flex h-svh w-full bg-flood-50 overflow-hidden">
      {/* ── Left Column: Sidebar ──────────────────────────────── */}
      <aside className="w-full max-w-md bg-white border-r border-flood-200 flex flex-col shadow-xl z-20">
        {/* Header */}
        <header className="px-6 py-5 border-b border-flood-100 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-flood-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-flood-600" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-flood-600" />
              <h1 className="text-xl font-bold text-flood-900 tracking-tight">
                Admin Dashboard
              </h1>
            </div>
          </div>
          <p className="text-sm text-flood-500 pl-11">
            {pendingReports.length} laporan menunggu verifikasi
          </p>
        </header>

        {/* List of Pending Reports */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pendingReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-flood-400">
              <Check className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Semua laporan telah diverifikasi</p>
            </div>
          ) : (
            pendingReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedLocation([report.latitude, report.longitude])}
                className="group p-4 rounded-xl border border-flood-100 bg-white hover:border-flood-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-flood-900 text-sm">
                    {report.title}
                  </h3>
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-md border border-amber-200">
                    Pending
                  </span>
                </div>
                
                <p className="text-xs text-flood-600 mb-4 line-clamp-2">
                  {report.description}
                </p>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-flood-50">
                  <div className="flex items-center gap-1.5 text-xs text-flood-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="capitalize">{report.severity}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleReject(report.id, e)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => handleApprove(report.id, e)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-flood-600 hover:bg-flood-700 shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Right Column: Mini-Map ────────────────────────────── */}
      <main className="flex-1 relative z-10">
        <MapContainer
          center={BANDAR_LAMPUNG}
          zoom={13}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater center={selectedLocation} />

          {/* Render all reports on map */}
          {reports.map((report) => {
            // Determine icon based on status
            let icon;
            if (report.status === "pending") icon = ICONS.pending;
            else if (report.status === "rejected") icon = ICONS.rejected;
            else icon = getPublishedIcon(); // Verified/Published uses dynamic color

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={icon}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <strong>{report.title}</strong>
                    <br />
                    <span className="text-xs opacity-70">
                      {report.severity.toUpperCase()} •{" "}
                      {report.status === "verified" ? "PUBLISHED" : report.status.toUpperCase()}
                    </span>
                    <br />
                    {report.description}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        
        {/* Legend */}
        <div className="absolute bottom-6 left-6 z-1000 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-flood-100 text-xs">
          <h4 className="font-semibold mb-2 text-flood-900">Legenda Peta</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span>Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex w-3 h-3 rounded-full bg-linear-to-r from-blue-500 to-red-500"></span>
              <span>Published (Bulan Genap: Biru, Ganjil: Merah)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
