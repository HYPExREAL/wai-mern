import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Navigation,
  LogOut,
  Menu,
  Layers,
  Info,
} from "lucide-react";
import { useReports } from "../hooks/useReports";
import AdminSidebar from "./AdminSidebar";
import { ICONS } from "./map/icons";
import ZoomControls from "./map/ZoomControls";
import GeoJSONLayer from "./map/GeoJSONLayer";

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
  const { reports, pendingReports, refreshPending } = useReports();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [layerDAS, setLayerDAS] = useState(false);
  const [layerBorder, setLayerBorder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex h-svh w-full bg-gray-100 overflow-hidden relative">
      
      {/* ── Mobile Sidebar Backdrop ────────────────────────────── */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* ── LEFT: Sidebar ─────────────────────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-[85vw] max-w-[380px] transform transition-transform duration-300 ease-in-out bg-gray-100
        md:relative md:translate-x-0 md:w-[380px] md:max-w-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar onReportClick={(lat, lng) => {
          setSelectedLocation([lat, lng]);
          setSidebarOpen(false);
        }} />
      </div>

      {/* ── RIGHT: Map ────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 pointer-events-none">
        <MapContainer
          center={BANDAR_LAMPUNG}
          zoom={13}
          className="h-full w-full z-0 pointer-events-auto"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater center={selectedLocation} />

          {/* GeoJSON Overlay Layers */}
          {layerBorder && (
            <GeoJSONLayer
              url="/layers/batas_kota.json"
              style={{ color: '#EF4444', weight: 3, opacity: 0.8, fillOpacity: 0.05, dashArray: '8 4' }}
            />
          )}
          {layerDAS && (
            <GeoJSONLayer
              url="/layers/das.geojson"
              style={{ color: '#EAB308', weight: 2.5, opacity: 0.8, fillOpacity: 0 }}
            />
          )}

          {[...reports, ...pendingReports].map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={
                report.status === "approved"
                  ? report.markerColor && ICONS[report.markerColor]
                    ? ICONS[report.markerColor]
                    : ICONS.approved
                  : ICONS.pending
              }
            >
              <Popup>
                <div className="text-sm min-w-[200px] max-w-[280px]">
                  {report.imageUrls && report.imageUrls.length > 0 ? (
                    <div className="w-full flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                      {report.imageUrls.map((url, idx) => (
                        <div key={idx} className="w-32 h-32 shrink-0 rounded-lg overflow-hidden border border-gray-100">
                          <img src={url} alt={`Documentation ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : report.imageUrl && (
                    <div className="w-full h-32 rounded-lg overflow-hidden mb-2">
                      <img src={report.imageUrl} alt="Documentation" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <strong className="block mb-1">{report.title}</strong>
                  <p className="text-gray-600 leading-tight">{report.description}</p>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{report.severity}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Floating Controls (Bottom Right) */}
          <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 z-1000 flex flex-col items-end gap-2 md:gap-4 pointer-events-auto">
            
            {/* Legend Toggle */}
            <div className="relative">
              {showLegend && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-4 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Legenda Admin</span>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#0ea5e9] shadow-sm shadow-[#0ea5e9]/40" />
                    <span className="text-xs font-bold text-[#003B6D]">Tertunda (Pending)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#DC2626] shadow-sm shadow-[#DC2626]/40" />
                    <span className="text-xs font-bold text-[#003B6D]">Ditolak (Rejected)</span>
                  </div>
                  <div className="w-full h-px bg-gray-100 my-1" />
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#16A34A] shadow-sm shadow-[#16A34A]/40" />
                    <span className="text-xs font-bold text-[#003B6D]">Laporan Divalidasi</span>
                  </div>
                </div>
              )}
              <button 
                onClick={() => {
                  setShowLegend(!showLegend);
                  if (!showLegend) setShowLayers(false);
                }}
                className={`p-3 md:p-4 rounded-full shadow-2xl border border-gray-100 transition-all ${
                  showLegend ? 'bg-[#005a9e] text-white' : 'bg-white text-[#005a9e] hover:bg-gray-50'
                }`}
                title="Legenda Peta"
              >
                <Info className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            {/* Layers Toggle */}
            <div className="relative">
              {showLayers && (
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Map Layers</span>
                  <label className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={layerBorder} 
                      onChange={() => setLayerBorder(!layerBorder)} 
                      className="accent-[#EF4444] w-4 h-4 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-0.5 bg-red-500 rounded-full" />
                      <span className="text-xs font-bold text-[#003B6D]">Batas Kota</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={layerDAS} 
                      onChange={() => setLayerDAS(!layerDAS)} 
                      className="accent-[#EAB308] w-4 h-4 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-0.5 bg-yellow-500 rounded-full" />
                      <span className="text-xs font-bold text-[#003B6D]">DAS (Sungai)</span>
                    </div>
                  </label>
                </div>
              )}
              <button 
                onClick={() => {
                  setShowLayers(!showLayers);
                  if (!showLayers) setShowLegend(false);
                }}
                className={`p-3 md:p-4 rounded-full shadow-2xl border border-gray-100 transition-all ${
                  showLayers ? 'bg-[#005a9e] text-white' : 'bg-white text-[#005a9e] hover:bg-gray-50'
                }`}
              >
                <Layers className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            <button 
              onClick={() => setSelectedLocation(BANDAR_LAMPUNG)}
              className="p-3 md:p-4 bg-white rounded-full shadow-2xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all"
            >
              <Navigation className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <ZoomControls />
          </div>
        </MapContainer>

        {/* Mobile: Hamburger + Logout (Top bar) */}
        <div className="absolute top-3 left-3 right-3 md:top-6 md:right-6 md:left-auto z-1000 pointer-events-auto flex justify-between md:justify-end items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-3 bg-white rounded-xl shadow-xl border border-gray-100 text-[#005a9e]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-3 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all font-bold text-xs md:text-sm uppercase tracking-wider"
          >
            <span className="hidden sm:inline">Logout</span>
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
