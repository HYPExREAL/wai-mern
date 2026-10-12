import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Crosshair,
  Send,
  Loader2,
  Search,
  Upload,
  Navigation,
  LogOut,
  X,
  MapPin,
  Layers,
  Info,
  Eye,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import type { FloodReport } from "../context/reportsContextDef";
import { useGeolocation } from "../hooks/useGeolocation";
import { useReports } from "../hooks/useReports";
import { useNotifications } from "../context/notificationContextDef";
import { ICONS, getIconFromSeverity } from "./map/icons";
import ZoomControls from "./map/ZoomControls";
import GeoJSONLayer from "./map/GeoJSONLayer";
import { useLayers } from "../hooks/useLayers";
import ReportDetailModal from "./ReportDetailModal";
import UserGuideModal from "./UserGuideModal";
import { formatDepth, getSeverityFromDepth } from "../utils/depthUtils";
import TimeSlider from "./TimeSlider";
import { isInsideBandarLampung, isInsideIteraArea, initBandarLampungGeofence } from "../utils/geofence";

const BANDAR_LAMPUNG: [number, number] = [-5.4294, 105.2617];

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      const target = e.originalEvent?.target as HTMLElement | null;
      if (target && target.closest('button, input, label, a, [role="button"], .leaflet-popup, .leaflet-control')) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterButton({ center, trigger, zoom = 16 }: { center: [number, number], trigger: number, zoom?: number }) {
  const map = useMap();
  const centerRef = useRef(center);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  useEffect(() => {
    if (trigger > 0) {
      map.flyTo(centerRef.current, zoom, { duration: 1.5 });
    }
  }, [trigger, map, zoom]);
  return null;
}

function MapBoundsListener({ onBoundsChange }: { onBoundsChange: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleBoundsChange = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    };
    
    handleBoundsChange();
  }, [map, onBoundsChange]);

  useMapEvents({
    moveend() {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    }
  });
  return null;
}

export default function InteractiveMap() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { reports, addReport, refreshReports } = useReports();
  const { notify } = useNotifications();
  const { layers: publicLayers, enabledIds, geoDataCache, toggleLayer } = useLayers(true);

  const [showReportForm, setShowReportForm] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [showLayers, setShowLayers] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [layerDAS, setLayerDAS] = useState(false);
  const [layerBorder, setLayerBorder] = useState(false);
  const [detailReport, setDetailReport] = useState<FloodReport | null>(null);
  const [filteredReports, setFilteredReports] = useState<FloodReport[]>(reports);

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [depth, setDepth] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [manualLocation, setManualLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [base64Images, setBase64Images] = useState<string[]>([]);
  
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<[number, number]>(BANDAR_LAMPUNG);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissGpsBanner, setDismissGpsBanner] = useState(false);

  useEffect(() => {
    initBandarLampungGeofence();
  }, []);

  const finalLat = manualLocation ? manualLocation[0] : geo.latitude;
  const finalLng = manualLocation ? manualLocation[1] : geo.longitude;

  const isLocationInside = useMemo(() => {
    if (finalLat === null || finalLng === null) return false;
    return isInsideBandarLampung(finalLng, finalLat);
  }, [finalLat, finalLng]);

  const accuracyOk = geo.accuracy !== null && geo.accuracy <= 2000;
  const hasValidLocation = manualLocation !== null || (!geo.loading && !geo.error && accuracyOk);
  const canSubmit =
    hasValidLocation &&
    isLocationInside &&
    name.trim() !== "" &&
    depth !== "";

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=105.178,-5.326,105.351,-5.518&limit=5`
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=105.178,-5.326,105.351,-5.518`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const inside = isInsideBandarLampung(lon, lat);
        setManualLocation([lat, lon]);
        setFlyToCoords([lat, lon]);
        setFlyTrigger((prev) => prev + 1);
        if (!inside) {
          notify("error", "Peringatan: Lokasi berada di luar wilayah operasional (Bandar Lampung / ITERA).");
        }
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
    const inside = isInsideBandarLampung(lon, lat);
    setSearchQuery(s.display_name);
    setManualLocation([lat, lon]);
    setFlyToCoords([lat, lon]);
    setFlyTrigger((prev) => prev + 1);
    setSuggestions([]);
    setShowSuggestions(false);
    if (!inside) {
      notify("error", "Peringatan: Lokasi berada di luar wilayah operasional (Bandar Lampung / ITERA).");
    }
  };

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
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles: File[] = [];
    const skippedNames: string[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        skippedNames.push(file.name);
      } else {
        validFiles.push(file);
      }
    }
    if (skippedNames.length > 0) {
      notify("error", `File terlalu besar (maks 5MB): ${skippedNames.join(", ")}`);
    }
    if (validFiles.length === 0) return;

    try {
      const compressedImages = await Promise.all(validFiles.map(compressImage));
      setImagePreviews(prev => [...prev, ...compressedImages]);
      setBase64Images(prev => [...prev, ...compressedImages]);
    } catch (error) {
      console.error("Compression error:", error);
      notify("error", "Gagal memproses gambar.");
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setBase64Images(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || finalLat === null || finalLng === null) {
      if (!isLocationInside && finalLat !== null && finalLng !== null) {
        notify("error", "Laporan ditolak: Lokasi pelaporan berada di luar wilayah operasional (Bandar Lampung / ITERA).");
      }
      return;
    }

    setSubmitting(true);
    try {
      await addReport(
        {
          title: name.trim() || "Anonim",
          description: description.trim() || `Dilaporkan pada ${date}`,
          latitude: finalLat,
          longitude: finalLng,
          severity: Number(depth),
          reporterName: name.trim() || "Anonim",
          imageUrl: base64Images.length > 0 ? base64Images[0] : undefined,
          imageUrls: base64Images.length > 0 ? base64Images : undefined,
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
      setImagePreviews([]);
      setBase64Images([]);
      setSearchQuery("");
      setTimeout(() => {
        setSubmitted(false);
        setShowReportForm(false);
      }, 2000);
    } catch (err) {
      let msg = "Gagal mengirim laporan. Silakan coba lagi.";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      notify("error", msg);
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
      
      <div className="absolute top-3 left-3 right-3 md:top-6 md:left-6 md:right-6 z-1000 flex items-center justify-between pointer-events-auto">
        
        <Link to="/" className="shrink-0 flex items-center gap-2 md:gap-3 bg-white px-2.5 py-2 md:px-3 md:py-2.5 rounded-xl md:rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all">
          <img src="/WAI.png" alt="WAI Logo" className="h-7 md:h-10 w-auto object-contain" />
          <div className="hidden sm:flex flex-col border-l border-gray-200 pl-2 md:pl-3">
            <span className="text-[#005a9e] font-bold text-xs md:text-sm tracking-tight leading-none mb-0.5">Water Awareness</span>
            <span className="text-[#005a9e] text-[10px] md:text-xs font-medium opacity-80 leading-none">& Information</span>
          </div>
        </Link>


        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="cursor-pointer shrink-0 flex items-center gap-1.5 px-3 py-2 md:px-3.5 md:py-2.5 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 hover:shadow-2xl transition-all font-bold text-xs md:text-sm active:scale-[0.98]"
            title="Panduan Penggunaan untuk Warga"
          >
            <HelpCircle className="w-4 h-4 text-[#005a9e]" />
            <span className="hidden sm:inline">Panduan Warga</span>
          </button>

          <button 
            onClick={handleTopRightAction}
            className="cursor-pointer shrink-0 flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 hover:shadow-2xl transition-all font-bold text-xs md:text-sm uppercase tracking-wider active:scale-[0.98]"
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
      </div>

      {geo.error && !manualLocation && !dismissGpsBanner && (
        <div className="absolute top-16 md:top-24 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-1000 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-amber-200 p-3.5 flex items-start gap-3 pointer-events-auto animate-slide-up">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100">
            <Navigation className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-xs text-[#003B6D]">Izin GPS Tidak Aktif</span>
              <button
                type="button"
                onClick={() => setDismissGpsBanner(true)}
                className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                title="Tutup pemberitahuan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
              Anda tetap bisa melapor! Cukup <strong>ketuk titik banjir di peta</strong> atau cari alamat untuk menandai lokasi manual.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-[11px] font-bold text-[#005a9e] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Baca Panduan Warga
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportForm && (
        <div className="fixed inset-x-0 bottom-0 md:absolute md:inset-auto md:top-32 md:left-6 z-1000 w-full md:w-auto md:max-w-sm animate-slide-up md:animate-slide-in-left pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-t-[24px] md:rounded-[32px] shadow-2xl border border-white/50 p-4 md:p-8 flex flex-col gap-3 md:gap-5 max-h-[60svh] md:max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[#005a9e] text-base md:text-xl font-bold">Lapor Banjir</h2>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-[#005a9e] rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer border border-blue-100"
                  title="Buka panduan bantuan warga"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Panduan</span>
                </button>
              </div>
              <button 
                type="button"
                onClick={() => setShowReportForm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 md:gap-4">
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
                  <label className="text-[#005a9e] text-xs font-bold pl-1 uppercase tracking-wider">Tingkat Banjir</label>
                  <select 
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="w-full px-3 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:border-[#005a9e] outline-none text-xs text-[#003B6D] font-bold bg-white"
                  >
                    <option value="" disabled>Pilih tingkat...</option>
                    <option value="15">Rendah (&lt; 30 cm)</option>
                    <option value="50">Sedang (30 - 70 cm)</option>
                    <option value="100">Tinggi (70 - 150 cm)</option>
                    <option value="160">Kritis (&gt; 150 cm)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[#005a9e] text-xs font-bold uppercase tracking-wider">Titik Lokasi Banjir</label>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-[11px] font-bold text-[#005a9e] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Panduan Lokasi
                  </button>
                </div>

                {manualLocation ? (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-[#003B6D]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <MapPin className="w-4 h-4 text-[#005a9e] shrink-0" />
                      <span>Titik Dipilih Manual di Peta</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setManualLocation(null);
                        setSearchQuery("");
                        setRecenterTrigger(prev => prev + 1);
                      }}
                      className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                    >
                      Reset / Gunakan GPS
                    </button>
                  </div>
                ) : geo.latitude && geo.longitude ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Otomatis via GPS Perangkat</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold">Akurasi ±{Math.round(geo.accuracy || 0)}m</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Lokasi Belum Ditentukan</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-tight">
                      Ketuk langsung pada titik banjir di peta atau cari alamat di bawah.
                    </p>
                  </div>
                )}
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
                      onClick={() => {
                        setManualLocation(null);
                        setSearchQuery("");
                        setRecenterTrigger(prev => prev + 1);
                      }}
                      title="Gunakan GPS"
                      className="shrink-0 p-2 md:p-2.5 rounded-xl border border-gray-200 bg-white text-[#005a9e] hover:bg-gray-50 transition-all"
                    >
                      <Crosshair className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>

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

                {finalLat !== null && finalLng !== null && (
                  <div className="flex flex-col gap-1.5 pl-1 pt-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-gray-500">
                        📍 {finalLat.toFixed(5)}, {finalLng.toFixed(5)}
                      </span>
                      {isLocationInside ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {isInsideIteraArea(finalLng, finalLat) ? "✓ Kawasan ITERA (Lamsel)" : "✓ Kota Bandar Lampung"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          ✕ Luar Wilayah
                        </span>
                      )}
                    </div>
                    {!isLocationInside && (
                      <div className="flex items-start gap-2 p-2.5 bg-red-50/90 border border-red-200 rounded-xl text-red-700 text-xs leading-snug">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                        <div>
                          <span className="font-bold block">Di Luar Wilayah Operasional</span>
                          <span className="text-[11px] text-red-600 block mt-0.5">
                            Lokus pelaporan terkunci khusus wilayah Kota Bandar Lampung dan Kawasan Kampus ITERA sekitarnya untuk mencegah laporan spam.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1 md:space-y-4 md:mb-8">
                <label className="block text-[#003B6D]/60 text-xs font-black uppercase tracking-widest mb-2">Unggah Foto</label>
                
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                        <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={(e) => { e.preventDefault(); removeImage(idx); }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-all opacity-90 hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative group mt-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden" 
                    id="image-upload" 
                  />
                  <label 
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center gap-2 md:gap-3 w-full h-16 md:h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#005a9e]/30 hover:bg-gray-100 transition-all cursor-pointer group-hover:scale-[0.99] active:scale-95"
                  >
                    <div className="flex items-center gap-2 text-[#005a9e]">
                      <Upload className="w-5 h-5" />
                      <span className="text-[#003B6D]/60 text-[10px] font-bold uppercase tracking-widest">Tambah Foto ({imagePreviews.length})</span>
                    </div>
                  </label>
                </div>
              </div>

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

              <button 
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full bg-[#005a9e] cursor-pointer text-white py-3 md:py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#004a82] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 md:mt-2 shadow-lg shadow-[#005a9e]/20 text-sm md:text-base"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {submitted
                  ? "Berhasil Dikirim!"
                  : !isLocationInside && finalLat !== null && finalLng !== null
                  ? "Lokasi di Luar Wilayah (Bdl/ITERA)"
                  : "Kirim Laporan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {!showReportForm && (
        <div className="absolute bottom-4 left-4 md:bottom-10 md:left-10 z-1000 pointer-events-auto">
        <button 
          onClick={() => setShowReportForm(!showReportForm)}
          className="cursor-pointer flex items-center gap-3 md:gap-6 bg-white pl-5 pr-4 py-3 md:pl-8 md:pr-6 md:py-4 rounded-2xl md:rounded-[32px] shadow-2xl border border-gray-100 hover:scale-105 transition-all group"
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
        
        <MapBoundsListener onBoundsChange={refreshReports} />

        <ClickHandler onMapClick={(lat, lng) => {
          const inside = isInsideBandarLampung(lng, lat);
          setManualLocation([lat, lng]);
          setShowReportForm(true);
          if (!inside) {
            notify("error", "Peringatan: Titik yang Anda pilih berada di luar wilayah Kota Bandar Lampung dan Kawasan ITERA.");
          }
        }} />

        <RecenterButton center={mapCenter} trigger={recenterTrigger} />
        <RecenterButton center={flyToCoords} trigger={flyTrigger} zoom={18} />

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

        {publicLayers.map(layer => enabledIds.has(layer._id) && geoDataCache[layer._id] && (
          <GeoJSONLayer key={layer._id} data={geoDataCache[layer._id]} style={layer.style} />
        ))}

        {manualLocation && (
          <Marker position={manualLocation} icon={ICONS.manual}>
            <Popup>
              <div className="flex flex-col gap-2 items-center text-center">
                <span className="font-bold text-xs text-[#003B6D]">Lokasi Manual</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setManualLocation(null);
                    setSearchQuery("");
                  }}
                  className="cursor-pointer px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors w-full border border-red-100 mt-1"
                >
                  Hapus Pin
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {filteredReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={getIconFromSeverity(report.severity, report.status)}
          >
            <Popup>
              <div className="text-sm min-w-[200px] max-w-[260px]">
                <strong className="block text-[#003B6D] text-sm mb-1">{report.reporterName || "Anonim"}</strong>
                <p className="text-gray-500 text-xs leading-snug line-clamp-2 mb-2">{report.description || "Tidak ada deskripsi"}</p>

                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getSeverityFromDepth(report.severity).colorClass}`}>
                    {formatDepth(report.severity)} — {getSeverityFromDepth(report.severity).label}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setDetailReport(report); }}
                  className="cursor-pointer w-full flex items-center justify-center gap-2 py-2 bg-[#005a9e] text-white rounded-xl text-xs font-bold hover:bg-[#004a82] transition-all active:scale-[0.97]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Lihat Detail
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {geo.latitude && geo.longitude && (
          <Marker position={[geo.latitude, geo.longitude]} icon={ICONS.user}>
            <Popup>Lokasi Anda</Popup>
          </Marker>
        )}

        <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 z-1000 flex flex-col items-end gap-2 md:gap-4 pointer-events-auto">
          
          <div className="relative">
            {showLegend && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-4 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tingkat Bahaya</span>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#10B981] shadow-sm shadow-[#10B981]/40" />
                  <span className="text-xs font-bold text-[#003B6D]">Rendah (&lt; 30 cm)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B] shadow-sm shadow-[#F59E0B]/40" />
                  <span className="text-xs font-bold text-[#003B6D]">Sedang (30 - 70 cm)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#F97316] shadow-sm shadow-[#F97316]/40" />
                  <span className="text-xs font-bold text-[#003B6D]">Tinggi (70 - 150 cm)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444] shadow-sm shadow-[#EF4444]/40" />
                  <span className="text-xs font-bold text-[#003B6D]">Kritis (&ge; 150 cm)</span>
                </div>
                
                <div className="w-full h-px bg-gray-100 my-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-1">Lainnya</span>
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#3B82F6] shadow-sm shadow-[#3B82F6]/40" />
                  <span className="text-xs font-bold text-[#003B6D]">Lokasi Anda</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#A855F7] shadow-sm shadow-[#A855F7]/40" />
                  <span className="text-xs font-bold text-[#003B6D]">Pin Manual</span>
                </div>
              </div>
            )}
            <button 
              onClick={() => {
                setShowLegend(!showLegend);
                if (!showLegend) setShowLayers(false);
              }}
              className={`p-3 md:p-4 rounded-full shadow-2xl border border-gray-100 transition-all cursor-pointer ${
                showLegend ? 'bg-[#005a9e] text-white' : 'bg-white text-[#005a9e] hover:bg-gray-50'
              }`}
              title="Legenda Peta"
            >
              <Info className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </div>

            <div className="relative">
              {showLayers && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-3 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1">Layer Statis</span>
                  <label className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <input type="checkbox" checked={layerBorder} onChange={() => setLayerBorder(!layerBorder)} className="accent-[#EF4444] w-4 h-4 rounded" />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-0.5 bg-red-500 rounded-full" />
                      <span className="text-xs font-bold text-[#003B6D]">Batas Kota</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <input type="checkbox" checked={layerDAS} onChange={() => setLayerDAS(!layerDAS)} className="accent-[#EAB308] w-4 h-4 rounded" />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-0.5 bg-yellow-500 rounded-full" />
                      <span className="text-xs font-bold text-[#003B6D]">DAS (Sungai)</span>
                    </div>
                  </label>
                  {publicLayers.length > 0 && (
                    <>
                      <div className="w-full h-px bg-gray-100 my-1" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1">Layer Tambahan</span>
                      {publicLayers.map(layer => (
                        <label key={layer._id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                          <input type="checkbox" checked={enabledIds.has(layer._id)} onChange={() => toggleLayer(layer._id)} className="w-4 h-4 rounded" style={{ accentColor: layer.style.color }} />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-0.5 rounded-full shrink-0" style={{ backgroundColor: layer.style.color }} />
                            <span className="text-xs font-bold text-[#003B6D] truncate">{layer.name}</span>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )}
              <button 
                onClick={() => {
                  setShowLayers(!showLayers);
                  if (!showLayers) setShowLegend(false);
                }}
                className={`p-3 md:p-4 rounded-full shadow-2xl border border-gray-100 transition-all cursor-pointer ${
                  showLayers ? 'bg-[#005a9e] text-white' : 'bg-white text-[#005a9e] hover:bg-gray-50'
                }`}
              >
                <Layers className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            <button 
              onClick={() => setRecenterTrigger(prev => prev + 1)}
              className="p-3 md:p-4 bg-white rounded-full shadow-2xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all cursor-pointer"
            >
              <Navigation className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            <ZoomControls />
        </div>
      </MapContainer>
      
      <TimeSlider reports={reports} onFilterChange={setFilteredReports} />

      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          showStatus={false}
        />
      )}

      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onStartManualPick={() => {
          setShowReportForm(true);
          notify("info", "Silakan klik/ketuk titik banjir langsung di peta.");
        }}
      />
    </div>
  );
}
