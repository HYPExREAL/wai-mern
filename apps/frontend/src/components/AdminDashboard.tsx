import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Navigation, LogOut, Layers, Info,
  Plus, Trash2, Eye, EyeOff, Upload, X, Palette
} from "lucide-react";
import { useReports } from "../hooks/useReports";
import { useLayers } from "../hooks/useLayers";
import { useNotifications } from "../context/notificationContextDef";
import AdminSidebar from "./AdminSidebar";
import { getIconFromSeverity, ICONS } from "./map/icons";
import ZoomControls from "./map/ZoomControls";
import GeoJSONLayer from "./map/GeoJSONLayer";
import type { FloodReport } from "../context/reportsContextDef";
import ReportDetailModal from "./ReportDetailModal";
import { formatDepth, getSeverityFromDepth } from "../utils/depthUtils";
import TimeSlider from "./TimeSlider";

function MapUpdater({ center, sidebarOpen }: { center: [number, number] | null; sidebarOpen?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 16, { duration: 1.5 });
  }, [center, map]);
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(timer);
  }, [sidebarOpen, map]);
  return null;
}

const BANDAR_LAMPUNG: [number, number] = [-5.4294, 105.2617];

const COLOR_PRESETS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4",
];

export default function AdminDashboard() {
  const { reports, pendingReports, refreshPending } = useReports();
  const allReports = useMemo(() => [...reports, ...pendingReports], [reports, pendingReports]);
  const [filteredReports, setFilteredReports] = useState<FloodReport[]>(allReports);
  const { layers, enabledIds, geoDataCache, toggleLayer, uploadLayer, deleteLayer, updateLayer } = useLayers();
  const { notify, confirm } = useNotifications();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [showLayers, setShowLayers] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [layerDAS, setLayerDAS] = useState(false);
  const [layerBorder, setLayerBorder] = useState(false);
  const [uniformMarker, setUniformMarker] = useState(false);

  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [detailReport, setDetailReport] = useState<FloodReport | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadColor, setUploadColor] = useState("#3B82F6");
  const [uploadPublic, setUploadPublic] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => { refreshPending(); }, [refreshPending]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleUploadLayer = async () => {
    if (!uploadFile || !uploadName.trim()) {
      notify("error", "Nama layer dan file wajib diisi.");
      return;
    }
    try {
      setUploading(true);
      const result = await uploadLayer({
        file: uploadFile,
        name: uploadName.trim(),
        color: uploadColor,
        isPublic: uploadPublic,
      });
      const info = result.conversion;
      notify("success", `Layer berhasil diimpor! (${info.detectedFormat}, ${info.featureCount} fitur)`);
      setUploadName("");
      setUploadFile(null);
      setUploadPublic(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const msg = (err instanceof Error && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || err.message
        : "Gagal mengimpor layer.";
      notify("error", msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLayer = (id: string, name: string) => {
    confirm({
      title: "Hapus Layer?",
      message: `Apakah Anda yakin ingin menghapus layer "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Ya, Hapus",
      onConfirm: async () => {
        try {
          await deleteLayer(id);
          notify("success", "Layer berhasil dihapus.");
        } catch {
          notify("error", "Gagal menghapus layer.");
        }
      }
    });
  };

  const handleTogglePublic = async (id: string, currentPublic: boolean) => {
    try {
      await updateLayer(id, { isPublic: !currentPublic });
      notify("success", currentPublic ? "Layer disembunyikan dari publik." : "Layer ditampilkan ke publik.");
    } catch {
      notify("error", "Gagal mengubah visibilitas layer.");
    }
  };

  return (
    <div className="flex h-svh w-full bg-gray-100 overflow-hidden relative">
      
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden animate-backdrop-in" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-40 h-full transition-all duration-300 ease-in-out overflow-hidden shadow-2xl md:shadow-none
        ${sidebarOpen ? 'w-[85vw] md:w-[380px] translate-x-0 bg-white' : 'w-[85vw] md:w-[72px] -translate-x-full md:translate-x-0 bg-white md:border-r border-gray-200'}
        md:relative
      `}>
        <AdminSidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen}
          onReportClick={(lat, lng) => {
            setSelectedLocation([lat, lng]);
            if (window.innerWidth < 768) setSidebarOpen(false);
          }} 
        />
      </div>

      <main className="flex-1 relative z-10 pointer-events-none">
        <MapContainer center={BANDAR_LAMPUNG} zoom={13} className="h-full w-full z-0 pointer-events-auto" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={selectedLocation} sidebarOpen={sidebarOpen} />

          {layerBorder && (
            <GeoJSONLayer url="/layers/batas_kota.json" style={{ color: '#EF4444', weight: 3, opacity: 0.8, fillOpacity: 0.05, dashArray: '8 4' }} />
          )}
          {layerDAS && (
            <GeoJSONLayer url="/layers/das.geojson" style={{ color: '#EAB308', weight: 2.5, opacity: 0.8, fillOpacity: 0 }} />
          )}

          {layers.map(layer => enabledIds.has(layer._id) && geoDataCache[layer._id] && (
            <GeoJSONLayer key={layer._id} data={geoDataCache[layer._id]} style={layer.style} />
          ))}

          {filteredReports.map((report) => (
            <Marker key={report.id} position={[report.latitude, report.longitude]}
              icon={uniformMarker ? ICONS.user : getIconFromSeverity(report.severity, report.status)}
            >
              <Popup>
                <div className="text-sm min-w-[200px] max-w-[260px]">
                  <strong className="block text-[#003B6D] text-sm mb-1">{report.reporterName || "Anonim"}</strong>
                  <p className="text-gray-500 text-xs leading-snug line-clamp-2 mb-2">{report.description}</p>

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
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#005a9e] text-white rounded-xl text-xs font-bold hover:bg-[#004a82] transition-all active:scale-[0.97]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Detail
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 z-1000 flex flex-col items-end gap-2 md:gap-4 pointer-events-auto">
            
            <div className="relative">
              {showLegend && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-4 flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status Laporan</span>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#0ea5e9] shadow-sm shadow-[#0ea5e9]/40" />
                  <span className="text-xs font-bold text-[#003B6D]">Tertunda (Pending)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#DC2626] shadow-sm shadow-[#DC2626]/40" />
                  <span className="text-xs font-bold text-[#003B6D]">Ditolak (Rejected)</span>
                </div>
                
                <div className="w-full h-px bg-gray-100 my-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-1">Laporan Divalidasi</span>
                
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
              </div>
              )}
              <button 
                onClick={() => { setShowLegend(!showLegend); if (!showLegend) setShowLayers(false); }}
                className={`p-3 md:p-4 rounded-full shadow-2xl border border-gray-100 transition-all ${showLegend ? 'bg-[#005a9e] text-white' : 'bg-white text-[#005a9e] hover:bg-gray-50'}`}
                title="Legenda Peta"
              >
                <Info className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            <div className="relative">
              {showLayers && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-3 flex flex-col gap-1">
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

                  {layers.length > 0 && (
                    <>
                      <div className="w-full h-px bg-gray-100 my-1" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1">Layer Database</span>
                      {layers.map(layer => (
                        <label key={layer._id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                          <input type="checkbox" checked={enabledIds.has(layer._id)} onChange={() => toggleLayer(layer._id)}
                            className="w-4 h-4 rounded" style={{ accentColor: layer.style.color }} />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-5 h-0.5 rounded-full shrink-0" style={{ backgroundColor: layer.style.color }} />
                            <span className="text-xs font-bold text-[#003B6D] truncate">{layer.name}</span>
                          </div>
                        </label>
                      ))}
                    </>
                  )}

                  <div className="w-full h-px bg-gray-100 my-1" />
                  <button
                    onClick={() => { setShowLayerPanel(true); setShowLayers(false); }}
                    className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-[#005a9e]/5 transition-colors text-[#005a9e]"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold">Kelola Layer</span>
                  </button>
                </div>
              )}
              <button 
                onClick={() => { setShowLayers(!showLayers); if (!showLayers) setShowLegend(false); }}
                className={`p-3 md:p-4 rounded-full shadow-2xl border border-gray-100 transition-all ${showLayers ? 'bg-[#005a9e] text-white' : 'bg-white text-[#005a9e] hover:bg-gray-50'}`}
              >
                <Layers className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            <button 
              onClick={() => setUniformMarker(!uniformMarker)}
              className={`p-3 md:p-4 rounded-full shadow-2xl border border-gray-100 transition-all ${uniformMarker ? 'bg-[#005a9e] text-white' : 'bg-white text-[#005a9e] hover:bg-gray-50'}`}
              title={uniformMarker ? "Tampilkan Warna Kedalaman" : "Tampilkan Warna Seragam"}
            >
              <Palette className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            <button onClick={() => setSelectedLocation(BANDAR_LAMPUNG)}
              className="p-3 md:p-4 bg-white rounded-full shadow-2xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all">
              <Navigation className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <ZoomControls />
          </div>
        </MapContainer>

        <TimeSlider reports={allReports} onFilterChange={setFilteredReports} />

        <div className="absolute top-3 left-3 right-3 md:top-6 md:left-6 md:right-6 z-1000 pointer-events-auto flex justify-between items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="md:hidden p-3 bg-white rounded-xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
          
          <div className="hidden md:block" />

          <button onClick={handleLogout}
            className="group flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-3 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all font-bold text-xs md:text-sm uppercase tracking-wider">
            <span className="hidden sm:inline">Logout</span>
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </main>

      {showLayerPanel && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-[#003B6D]/40 backdrop-blur-md animate-backdrop-in" onClick={() => setShowLayerPanel(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[85svh] animate-slide-up md:animate-scale-in">
            
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="p-5 md:p-8 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
              
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-black text-[#003B6D]">Kelola Layer</h2>
                <button onClick={() => setShowLayerPanel(false)} className="p-2 bg-gray-100 rounded-xl text-gray-400 hover:text-red-500 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tambah Layer Baru</span>
                
                <input
                  type="text" placeholder="Nama Layer"
                  value={uploadName} onChange={e => setUploadName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#003B6D] focus:border-[#005a9e] outline-none transition-all"
                />

                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-gray-400 shrink-0">Warna:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map(c => (
                      <button key={c} onClick={() => setUploadColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${uploadColor === c ? 'border-[#003B6D] scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={uploadPublic} onChange={e => setUploadPublic(e.target.checked)} className="accent-[#005a9e] w-4 h-4" />
                  <span className="text-xs font-bold text-[#003B6D]">Tampilkan di peta publik</span>
                </label>

                <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-400 hover:border-[#005a9e] hover:text-[#005a9e] transition-all">
                    <Upload className="w-4 h-4" />
                    {uploadFile ? uploadFile.name : "Pilih file spasial"}
                  </button>
                  <input ref={fileInputRef} type="file" accept=".geojson,.json,.zip,.kml,.kmz,.gpx,.csv" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }} />
                </div>

                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Format: GeoJSON, Shapefile (.zip), KML, KMZ, GPX, CSV</p>

                <button onClick={handleUploadLayer} disabled={uploading || !uploadFile || !uploadName.trim()}
                  className="w-full py-3 bg-[#005a9e] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#004a8e] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {uploading ? "Mengkonversi & Upload..." : <><Plus className="w-4 h-4" /> Tambah Layer</>}
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Layer Tersimpan ({layers.length})</span>
                {layers.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Belum ada layer yang diupload</p>
                ) : (
                  layers.map(layer => (
                    <div key={layer._id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 group hover:border-[#005a9e]/20 transition-all">
                      <div className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: layer.style.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#003B6D] truncate">{layer.name}</p>
                        <p className="text-[10px] text-gray-400">{layer.fileName}</p>
                      </div>
                      <button onClick={() => handleTogglePublic(layer._id, layer.isPublic)} title={layer.isPublic ? "Publik" : "Admin only"}
                        className={`p-1.5 rounded-lg transition-all ${layer.isPublic ? 'text-[#16A34A] bg-green-50' : 'text-gray-300 bg-gray-50'}`}>
                        {layer.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDeleteLayer(layer._id, layer.name)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {detailReport && (
        <ReportDetailModal report={detailReport} onClose={() => setDetailReport(null)} isAdmin={true} />
      )}
    </div>
  );
}
