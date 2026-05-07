import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
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
  MapPin,
  Layers,
} from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useReports } from "../hooks/useReports";
import { useNotifications } from "../context/notificationContextDef";
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

// ── Map sub-component: click handler ─────────────────────────
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      // Don't fire if the click was on a UI control (buttons, inputs, labels, etc.)
      const target = e.originalEvent?.target as HTMLElement | null;
      if (target && target.closest('button, input, label, a, [role="button"], .leaflet-popup, .leaflet-control')) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Map sub-component: fly to logic ────────────────────────────
function RecenterButton({ center, trigger, zoom = 16 }: { center: [number, number], trigger: number, zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [trigger, map, center, zoom]);
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

// ── Map sub-component: GeoJSON layer loader ────────────────────
interface GeoJSONLayerProps {
  url: string;
  style: L.PathOptions;
}
function GeoJSONLayer({ url, style }: GeoJSONLayerProps) {
  const [data, setData] = useState<GeoJSON.GeoJsonObject | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.json();
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((err) => console.warn('GeoJSON load error:', err));
    return () => { cancelled = true; };
  }, [url]);
  if (!data) return null;
  return <GeoJSON key={url} data={data} style={() => style} />;
}

// ── Main component ─────────────────────────────────────────────
export default function InteractiveMap() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { reports, addReport } = useReports();
  const { notify } = useNotifications();

  // UI State
  const [showReportForm, setShowReportForm] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [showLayers, setShowLayers] = useState(false);
  const [layerDAS, setLayerDAS] = useState(false);
  const [layerBorder, setLayerBorder] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [depth, setDepth] = useState<FloodReport["severity"] | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [manualLocation, setManualLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  // Search Suggestions State
  interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
  }
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number]>(BANDAR_LAMPUNG);
  const [flyTrigger, setFlyTrigger] = useState(0);

  const accuracyOk = geo.accuracy !== null && geo.accuracy <= 50; // Allow up to 50m — hook already keeps only the best reading
  const hasValidLocation = manualLocation !== null || (!geo.loading && !geo.error && accuracyOk);
  const canSubmit =
    hasValidLocation &&
    name.trim() !== "" &&
    depth !== "";

  const finalLat = manualLocation ? manualLocation[0] : geo.latitude;
  const finalLng = manualLocation ? manualLocation[1] : geo.longitude;

  // Fetch suggestions as user types (Debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Suggestions error:", err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setManualLocation([lat, lon]);
        setFlyToCoords([lat, lon]);
        setFlyTrigger((prev) => prev + 1);
      } else {
        notify("error", "Lokasi tidak ditemukan. Silakan cari lebih spesifik.");
      }
    } catch (error) {
      console.error("Search error:", error);
      notify("error", "Gagal mencari lokasi.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (s: NominatimResult) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    setSearchQuery(s.display_name);
    setManualLocation([lat, lon]);
    setFlyToCoords([lat, lon]);
    setFlyTrigger((prev) => prev + 1);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Client-side image compression
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress to 70% quality JPEG
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify("error", "Ukuran file terlalu besar (maksimal 5MB)");
        return;
      }
      
      try {
        // Show a temporary preview quickly if needed, or wait for compression
        const compressedBase64 = await compressImage(file);
        setImagePreview(compressedBase64);
        setBase64Image(compressedBase64);
      } catch (error) {
        console.error("Compression error:", error);
        notify("error", "Gagal memproses gambar.");
      }
    }
  };

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
          imageUrl: base64Image || undefined,
          reporterContact: undefined,
        },
        manualLocation ? 0 : (geo.accuracy || 0)
      );
      setSubmitted(true);
      notify("success", "Laporan Anda berhasil dikirim! Sedang menunggu verifikasi admin.");
      setName("");
      setDepth("");
      setDescription("");
      setManualLocation(null);
      setImagePreview(null);
      setBase64Image(null);
      setSearchQuery("");
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
    <div id="map-page" className="relative h-svh w-full overflow-hidden bg-gray-100">
      
      {/* ── TOP BAR: Logo + Search + Exit ────────────────────── */}
      <div className="absolute top-3 left-3 right-3 md:top-6 md:left-6 md:right-6 z-1000 flex items-center justify-between pointer-events-auto">
        
        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center gap-2 md:gap-3 bg-white px-2.5 py-2 md:px-3 md:py-2.5 rounded-xl md:rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all">
          <img src="/WAI.png" alt="WAI Logo" className="h-7 md:h-10 w-auto object-contain" />
          <div className="hidden sm:flex flex-col border-l border-gray-200 pl-2 md:pl-3">
            <span className="text-[#005a9e] font-bold text-xs md:text-sm tracking-tight leading-none mb-0.5">Water Awareness</span>
            <span className="text-[#005a9e] text-[10px] md:text-xs font-medium opacity-80 leading-none">& Information</span>
          </div>
        </Link>


        {/* Exit / Logout Button */}
        <button 
          onClick={handleTopRightAction}
          className="shrink-0 flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all font-bold text-xs md:text-sm uppercase tracking-wider"
        >
          {isAdmin ? (
            <>
              <span className="hidden sm:inline">Logout</span>
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Exit</span>
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </>
          )}
        </button>
      </div>

      {/* ── LEFT: Report Form Card ─────────────────────────────── */}
      {showReportForm && (
        <div className="fixed inset-x-0 bottom-0 md:absolute md:inset-auto md:top-32 md:left-6 z-1000 w-full md:w-auto md:max-w-sm animate-[slideIn_0.4s_ease-out] pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-t-[24px] md:rounded-[32px] shadow-2xl border border-white/50 p-4 md:p-8 flex flex-col gap-3 md:gap-5 max-h-[55svh] md:max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-[#005a9e] text-base md:text-xl font-bold">Lapor Banjir</h2>
              <button 
                type="button"
                onClick={() => setShowReportForm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 md:gap-4">
              {/* Nama Pelapor */}
              <div className="space-y-1">
                <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Nama Pelapor</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:border-[#005a9e] focus:ring-2 focus:ring-[#005a9e]/10 outline-none text-sm transition-all"
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
                    className="w-full px-3 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:border-[#005a9e] outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Kedalaman</label>
                  <div className="relative">
                    <select 
                      value={depth}
                      onChange={(e) => setDepth(e.target.value as FloodReport["severity"] | "")}
                      className="w-full px-3 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:border-[#005a9e] outline-none text-xs appearance-none"
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

              {/* Lokasi — Search + Coordinates */}
              <div className="space-y-1.5">
                <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Cari Lokasi</label>
                <div className="relative">
                  <div className="flex gap-1.5">
                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#005a9e] focus-within:ring-2 focus-within:ring-[#005a9e]/10 transition-all">
                      <input 
                        type="text"
                        placeholder="Ketik alamat atau klik peta..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="flex-1 min-w-0 px-3 py-2 md:py-2.5 bg-transparent outline-none text-xs text-[#003B6D] font-bold placeholder:text-gray-400"
                      />
                      <button 
                        type="button"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="shrink-0 p-2 text-[#005a9e] hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setManualLocation(null)}
                      title="Gunakan GPS"
                      className="shrink-0 p-2 md:p-2.5 rounded-xl border border-gray-200 bg-white text-[#005a9e] hover:bg-gray-50 transition-all"
                    >
                      <Crosshair className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>

                  {/* Inline Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 max-h-40 overflow-y-auto">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(s)}
                          className="w-full text-left px-3 py-2 hover:bg-[#005a9e]/5 transition-colors flex items-start gap-2 border-b border-gray-50 last:border-0"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#005a9e] mt-0.5 shrink-0" />
                          <span className="text-[11px] font-bold text-[#003B6D] line-clamp-1 leading-snug">
                            {s.display_name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coordinate display */}
                {finalLat !== null && finalLng !== null && (
                  <p className="text-[10px] text-gray-400 font-mono pl-1">
                    📍 {finalLat.toFixed(5)}, {finalLng.toFixed(5)}
                  </p>
                )}
              </div>

              {/* Dokumentasi */}
              <div className="space-y-1 md:space-y-4 md:mb-8">
              <label className="block text-[#003B6D]/60 text-xs font-black uppercase tracking-widest mb-2">Unggah Foto</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden" 
                  id="image-upload" 
                />
                <label 
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center gap-2 md:gap-3 w-full aspect-3/1 md:aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl md:rounded-3xl hover:border-[#005a9e]/30 hover:bg-gray-100 transition-all cursor-pointer group-hover:scale-[0.99] active:scale-95 overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="p-2 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-sm text-[#005a9e]">
                        <Upload className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <span className="text-[#003B6D]/60 text-[10px] font-bold uppercase tracking-widest">Klik untuk unggah</span>
                    </>
                  )}
                </label>
                {imagePreview && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setImagePreview(null);
                      setBase64Image(null);
                    }}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all scale-90 hover:scale-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
                className="w-full bg-[#005a9e] text-white py-3 md:py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#004a82] transition-all disabled:opacity-50 mt-1 md:mt-2 shadow-lg shadow-[#005a9e]/20 text-sm md:text-base"
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
        <div className="absolute bottom-4 left-4 md:bottom-10 md:left-10 z-1000 pointer-events-auto">
        <button 
          onClick={() => setShowReportForm(!showReportForm)}
          className="flex items-center gap-3 md:gap-6 bg-white pl-5 pr-4 py-3 md:pl-8 md:pr-6 md:py-4 rounded-2xl md:rounded-[32px] shadow-2xl border border-gray-100 hover:scale-105 transition-all group"
        >
          <span className="text-[#005a9e] text-2xl md:text-5xl font-black tracking-tighter uppercase italic">Lapor</span>
          <div className="relative">
            <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#005a9e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-[#005a9e]"></span>
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
        <RecenterButton center={flyToCoords} trigger={flyTrigger} zoom={18} />

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
              <div className="text-sm min-w-[200px]">
                {report.imageUrl && (
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

        {geo.latitude && geo.longitude && (
          <Marker position={[geo.latitude, geo.longitude]} icon={ICONS.user}>
            <Popup>Lokasi Anda</Popup>
          </Marker>
        )}

        {/* ── BOTTOM RIGHT: Controls ────────────────────────────── */}
        <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 z-1000 flex flex-col items-end gap-2 md:gap-4 pointer-events-auto">
          
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
              onClick={() => setShowLayers(!showLayers)}
              className={`p-3 md:p-4 rounded-full shadow-2xl border border-gray-100 transition-all ${
                showLayers ? 'bg-[#005a9e] text-white' : 'bg-white text-[#005a9e] hover:bg-gray-50'
              }`}
            >
              <Layers className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </div>

          {/* Geo Control */}
          <button 
            onClick={() => setRecenterTrigger(prev => prev + 1)}
            className="p-3 md:p-4 bg-white rounded-full shadow-2xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all"
          >
            <Navigation className="w-6 h-6 md:w-8 md:h-8" />
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
