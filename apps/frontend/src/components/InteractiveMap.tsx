import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Crosshair,
  Send,
  Loader2,
  ChevronDown,
  Search,
  Upload,
  Plus,
  Minus,
  Navigation,
  LogOut,
  X,
} from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useReports } from "../hooks/useReports";
import type { FloodReport } from "../context/reportsContextDef";

// ── Bandar Lampung center ──────────────────────────────────────
const BANDAR_LAMPUNG: [number, number] = [-5.4294, 105.2617];

// ── Custom marker icons ────────────────────────────────────────
function makeSvgIcon(color: string, strokeColor = "#fff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
    <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 28 16 28s16-16 16-28C32 7.164 24.836 0 16 0z" fill="${color}" stroke="${strokeColor}" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
  });
}

const ICONS: Record<string, L.DivIcon> = {
  pending: makeSvgIcon("#0ea5e9"),   // light blue
  approved: makeSvgIcon("#16A34A"),  // green
  rejected: makeSvgIcon("#DC2626"), // red
  user: makeSvgIcon("#3B82F6"),     // blue — user location
  manual: makeSvgIcon("#A855F7"),   // purple — manual pin
  blue: makeSvgIcon("#2563EB"),     // March
  red: makeSvgIcon("#EF4444"),      // April
};

// ── Map sub-component: click handler ───────────────────────────
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Map sub-component: fly to logic ────────────────────────────
function RecenterButton({ center, trigger }: { center: [number, number], trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [trigger, map, center]);
  return null;
}

// ── Map sub-component: zoom controls ───────────────────────────
function ZoomControls() {
  const map = useMap();
  return (
    <div className="flex items-center bg-white rounded-full shadow-xl border border-gray-100 overflow-hidden">
      <button 
        onClick={() => map.zoomOut()}
        className="p-3 hover:bg-gray-50 transition-colors text-[#005a9e]"
      >
        <Minus className="w-6 h-6 stroke-3" />
      </button>
      <div className="w-px h-6 bg-gray-200" />
      <button 
        onClick={() => map.zoomIn()}
        className="p-3 hover:bg-gray-50 transition-colors text-[#005a9e]"
      >
        <Plus className="w-6 h-6 stroke-3" />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function InteractiveMap() {
  const geo = useGeolocation();
  const { reports, addReport } = useReports();

  // UI State
  const [showReportForm, setShowReportForm] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [depth, setDepth] = useState<FloodReport["severity"] | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [manualLocation, setManualLocation] = useState<[number, number] | null>(null);

  const accuracyOk = geo.accuracy !== null && geo.accuracy <= 20; // Relaxed for better UX
  const hasValidLocation = manualLocation !== null || (!geo.loading && !geo.error && accuracyOk);
  const canSubmit =
    hasValidLocation &&
    name.trim() !== "" &&
    depth !== "";

  const finalLat = manualLocation ? manualLocation[0] : geo.latitude;
  const finalLng = manualLocation ? manualLocation[1] : geo.longitude;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || finalLat === null || finalLng === null) return;

    setSubmitting(true);
    try {
      await addReport(
        {
          title: `Banjir: ${name.trim()}`,
          description: description.trim() || `Dilaporkan pada ${date}`,
          latitude: finalLat,
          longitude: finalLng,
          severity: depth as FloodReport["severity"],
          reporterName: name.trim(),
          imageUrl: undefined,
          reporterContact: undefined,
        },
        geo.accuracy || 0
      );
      setSubmitted(true);
      setName("");
      setDepth("");
      setDescription("");
      setManualLocation(null);
      setTimeout(() => {
        setSubmitted(false);
        setShowReportForm(false);
      }, 2000);
    } catch {
      alert("Gagal mengirim laporan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const mapCenter = useMemo<[number, number]>(
    () => (geo.latitude && geo.longitude ? [geo.latitude, geo.longitude] : BANDAR_LAMPUNG),
    [geo.latitude, geo.longitude]
  );

  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const handleTopRightAction = () => {
    if (isAdmin) {
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("token");
      navigate("/");
    } else {
      navigate("/");
    }
  };

  return (
    <div id="map-page" className="relative h-screen w-full overflow-hidden bg-gray-100">
      
      {/* ── TOP LEFT: Logo Card ────────────────────────────────── */}
      <div className="absolute top-6 left-6 z-1000">
        <Link to="/" className="flex items-center gap-3 bg-white p-3 pr-6 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all group pointer-events-auto">
          <img src="/WAI.png" alt="WAI Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col border-l border-gray-200 pl-3">
            <span className="text-[#005a9e] font-bold text-sm tracking-tight leading-none mb-0.5">Water Awareness</span>
            <span className="text-[#005a9e] text-xs font-medium opacity-80 leading-none">& Information</span>
          </div>
        </Link>
      </div>

      {/* ── TOP RIGHT: Utils ──────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-1000">
        <button 
          onClick={handleTopRightAction}
          className="group flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all pointer-events-auto font-bold text-sm uppercase tracking-wider"
        >
          {isAdmin ? (
            <>
              <span>Logout</span>
              <LogOut className="w-5 h-5" />
            </>
          ) : (
            <>
              <span>Exit</span>
              <X className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* ── LEFT: Report Form Card ─────────────────────────────── */}
      {showReportForm && (
        <div className="absolute top-32 left-6 z-1000 w-full max-w-sm animate-[slideIn_0.4s_ease-out] pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-2xl border border-white/50 p-6 md:p-8 flex flex-col gap-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[#005a9e] text-xl font-bold">Lapor Banjir</h2>
              <button 
                type="button"
                onClick={() => setShowReportForm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nama Pelapor */}
              <div className="space-y-1">
                <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Nama Pelapor</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#005a9e] focus:ring-2 focus:ring-[#005a9e]/10 outline-none text-sm transition-all"
                  placeholder="Nama Lengkap"
                />
              </div>

              {/* Tanggal & Kedalaman */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Tanggal Pelapor</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#005a9e] outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Kedalaman</label>
                  <div className="relative">
                    <select 
                      value={depth}
                      onChange={(e) => setDepth(e.target.value as FloodReport["severity"] | "")}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#005a9e] outline-none text-xs appearance-none"
                    >
                      <option value="">Pilih</option>
                      <option value="low">Rendah</option>
                      <option value="moderate">Sedang</option>
                      <option value="high">Tinggi</option>
                      <option value="critical">Kritis</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Lokasi Koordinat */}
              <div className="space-y-1">
                <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Lokasi Koordinat</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      readOnly
                      value={finalLat && finalLng ? `${finalLat.toFixed(5)}, ${finalLng.toFixed(5)}` : ""}
                      placeholder="Klik peta atau gunakan GPS"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-500"
                    />
                    <div className="absolute right-0 top-0 h-full aspect-square bg-[#005a9e] rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-[#004a82] transition-colors">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setManualLocation(null)}
                    className="p-2.5 rounded-xl border border-gray-200 bg-white text-[#005a9e] hover:bg-gray-50 transition-all"
                  >
                    <Crosshair className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Dokumentasi */}
              <div className="space-y-1">
                <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Dokumentasi Kejadian</label>
                <div className="relative w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-[#005a9e]/30 transition-all">
                  <div className="absolute right-2 bottom-2 bg-[#005a9e] text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <span>Unggah</span>
                    <Upload className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Deskripsi Kejadian</label>
                <textarea 
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ketik keterangan tambahan di sini..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#005a9e] outline-none text-xs resize-none"
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full bg-[#005a9e] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#004a82] transition-all disabled:opacity-50 mt-2 shadow-lg shadow-[#005a9e]/20"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitted ? "Berhasil Dikirim!" : "Kirim Laporan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── BOTTOM LEFT: Large Lapor Button ────────────────────── */}
      {!showReportForm && (
        <div className="absolute bottom-10 left-10 z-1000 pointer-events-auto">
        <button 
          onClick={() => setShowReportForm(!showReportForm)}
          className="flex items-center gap-6 bg-white pl-8 pr-6 py-4 rounded-[32px] shadow-2xl border border-gray-100 hover:scale-105 transition-all group"
        >
          <span className="text-[#005a9e] text-5xl font-black tracking-tighter uppercase italic">Lapor</span>
          <div className="relative">
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#005a9e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#005a9e]"></span>
            </span>
          </div>
        </button>
      </div>
      )}


      {/* ── MAP CONTAINER ─────────────────────────────────────── */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onMapClick={(lat, lng) => {
          setManualLocation([lat, lng]);
          setShowReportForm(true);
        }} />

        <RecenterButton center={mapCenter} trigger={recenterTrigger} />

        {manualLocation && (
          <Marker position={manualLocation} icon={ICONS.manual}>
            <Popup>Lokasi Kejadian Manual</Popup>
          </Marker>
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={
              report.markerColor && ICONS[report.markerColor]
                ? ICONS[report.markerColor]
                : ICONS.approved
            }
          >
            <Popup>
              <div className="text-sm">
                <strong>{report.title}</strong><br/>
                {report.description}
              </div>
            </Popup>
          </Marker>
        ))}

        {geo.latitude && geo.longitude && (
          <Marker position={[geo.latitude, geo.longitude]} icon={ICONS.user}>
            <Popup>Lokasi Anda</Popup>
          </Marker>
        )}

        {/* ── BOTTOM RIGHT: Controls ────────────────────────────── */}
        <div className="absolute bottom-10 right-10 z-1000 flex flex-col items-end gap-4 pointer-events-auto">
          {/* Geo Control */}
          <button 
            onClick={() => setRecenterTrigger(prev => prev + 1)}
            className="p-4 bg-white rounded-full shadow-2xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all"
          >
            <Navigation className="w-8 h-8" />
          </button>
          {/* Zoom Control */}
          <ZoomControls />
        </div>
      </MapContainer>

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

