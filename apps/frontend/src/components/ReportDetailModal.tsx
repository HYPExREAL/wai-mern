import { useState, useEffect } from "react";
import { X, User, Clock, MapPin, Droplets, Loader2 } from "lucide-react";
import type { FloodReport } from "../context/reportsContextDef";
import { formatDepth, getSeverityFromDepth } from "../utils/depthUtils";
import apiClient from "../api/apiClient";

interface ReportDetailModalProps {
  /** The report to display — images may be missing (list projection). */
  report: FloodReport;
  /** Called when the modal should close. */
  onClose: () => void;
  /** Whether to show the status badge (default true). */
  showStatus?: boolean;
}

/**
 * Shared Report Detail Modal — used by both ReportHistory and InteractiveMap.
 * Lazy-loads the full report (with base64 images) from /api/reports/:id
 * so the initial list/map request stays lightweight.
 */
export default function ReportDetailModal({ report, onClose, showStatus = true }: ReportDetailModalProps) {
  const [fullReport, setFullReport] = useState<FloodReport>(report);
  const [loadingImages, setLoadingImages] = useState(true);

  // Fetch the full report (with images) on mount
  useEffect(() => {
    let cancelled = false;
    apiClient.get(`/reports/${report.id}`)
      .then(res => {
        if (cancelled) return;
        const full = res.data;
        setFullReport({
          ...report,
          imageUrl: full.imageUrl,
          imageUrls: full.imageUrls,
        });
      })
      .catch(() => {
        // Keep the partial data if fetch fails
      })
      .finally(() => {
        if (!cancelled) setLoadingImages(false);
      });
    return () => { cancelled = true; };
  }, [report]);

  return (
    <div className="fixed inset-0 z-2000 flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#003B6D]/40 backdrop-blur-md animate-backdrop-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[40px] shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[90svh] md:max-h-[85vh] animate-slide-up md:animate-scale-in">
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header / Image Area */}
        <div className="relative w-full aspect-video bg-gray-100 shrink-0 overflow-x-auto flex snap-x snap-mandatory custom-scrollbar">
          {loadingImages ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3 shrink-0 snap-center">
              <Loader2 className="w-8 h-8 animate-spin opacity-40" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Memuat foto...</span>
            </div>
          ) : fullReport.imageUrls && fullReport.imageUrls.length > 0 ? (
            fullReport.imageUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Dokumentasi ${idx + 1}`}
                className="w-full h-full object-cover shrink-0 snap-center"
              />
            ))
          ) : fullReport.imageUrl ? (
            <img
              src={fullReport.imageUrl}
              alt="Dokumentasi"
              className="w-full h-full object-cover shrink-0 snap-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3 shrink-0 snap-center">
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                <Droplets className="w-8 h-8 opacity-20" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Tidak ada foto</span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-6 md:right-6 p-2 md:p-3 bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl text-gray-500 hover:text-red-500 transition-all hover:scale-110"
          >
            <X size={18} />
          </button>

          {/* Status Badge */}
          {showStatus && (
            <div className={`absolute bottom-3 left-3 md:bottom-6 md:left-6 px-3 py-1.5 md:px-4 md:py-2 text-white rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-lg ${
              fullReport.status === 'approved' ? 'bg-[#16A34A]' :
              fullReport.status === 'rejected' ? 'bg-[#DC2626]' :
              'bg-amber-500'
            }`}>
              {fullReport.status === 'approved' ? 'Divalidasi' :
               fullReport.status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 md:p-8 flex flex-col gap-4 md:gap-6 overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-lg md:text-2xl font-black text-[#003B6D] mb-1 md:mb-2 leading-tight">
              {fullReport.title}
            </h3>
            <p className="text-gray-500 text-xs md:text-sm leading-relaxed italic">
              "{fullReport.description || 'Tidak ada deskripsi tambahan'}"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Reporter */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center gap-3 md:gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm text-[#005a9e]">
                <User size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Pelapor</span>
                <span className="text-sm font-bold text-[#003B6D]">{fullReport.reporterName || 'Anonim'}</span>
              </div>
            </div>

            {/* Time */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center gap-3 md:gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm text-amber-500">
                <Clock size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Waktu</span>
                <span className="text-sm font-bold text-[#003B6D]">
                  {new Date(fullReport.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Depth Info */}
          <div className="bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`p-2.5 rounded-xl shadow-sm ${getSeverityFromDepth(fullReport.severity).colorClass}`}>
                <Droplets size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Kedalaman</span>
                <span className="text-sm font-bold text-[#003B6D]">{formatDepth(fullReport.severity)}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getSeverityFromDepth(fullReport.severity).colorClass}`}>
              {getSeverityFromDepth(fullReport.severity).label}
            </span>
          </div>

          {/* Coordinates */}
          <div className="bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center gap-3 md:gap-4">
            <div className="p-2.5 bg-white rounded-xl shadow-sm text-red-500">
              <MapPin size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Koordinat</span>
              <span className="text-sm font-bold text-[#003B6D]">
                {fullReport.latitude.toFixed(5)}, {fullReport.longitude.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl font-bold hover:bg-gray-100 hover:text-gray-500 transition-all active:scale-[0.98] uppercase text-xs tracking-widest border border-gray-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
