import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Plus, 
  Minus, 
  Navigation,
  LogOut,
} from "lucide-react";
import { useReports } from "../hooks/useReports";
import AdminSidebar from "./AdminSidebar";

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

const ICONS = {
  pending: makeSvgIcon("#0ea5e9"),   // light blue
  approved: makeSvgIcon("#16A34A"),  // green
  rejected: makeSvgIcon("#DC2626"), // red
};

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

const BANDAR_LAMPUNG: [number, number] = [-5.4294, 105.2617];

export default function AdminDashboard() {
  const { reports } = useReports();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden relative">
      
      {/* ── LEFT: Sidebar ─────────────────────────────────────── */}
      <AdminSidebar onReportClick={(lat, lng) => setSelectedLocation([lat, lng])} />

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

          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={report.status === "approved" ? ICONS.approved : ICONS.pending}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{report.title}</strong><br/>
                  {report.description}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Floating Controls (Bottom Right) */}
          <div className="absolute bottom-10 right-10 z-1000 flex flex-col items-end gap-4 pointer-events-auto">
            <button 
              onClick={() => setSelectedLocation(BANDAR_LAMPUNG)}
              className="p-4 bg-white rounded-full shadow-2xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all"
            >
              <Navigation className="w-8 h-8" />
            </button>
            <ZoomControls />
          </div>
        </MapContainer>

        {/* Floating Utils (Top Right) */}
        <div className="absolute top-6 right-6 z-1000 pointer-events-auto">
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all font-bold text-sm uppercase tracking-wider"
          >
            <span>Logout</span>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #005a9e20;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #005a9e40;
        }
      `}</style>
    </div>
  );
}

