import { useState, useEffect } from "react";
import { X, User, Clock, MapPin, Droplets, Loader2, Bot, Check, XCircle, Trash2 } from "lucide-react";
import type { FloodReport } from "../context/reportsContextDef";
import { formatDepth, getSeverityFromDepth } from "../utils/depthUtils";
import apiClient from "../api/apiClient";
import { predictImage } from "../utils/aiService";
import { getDistrictFromCoords } from "../utils/locationUtils";
import { useReports } from "../hooks/useReports";
import { useNotifications } from "../context/notificationContextDef";

interface ReportDetailModalProps {
  report: FloodReport;
  onClose: () => void;
  showStatus?: boolean;
  isAdmin?: boolean;
}

export default function ReportDetailModal({ report, onClose, showStatus = true, isAdmin = false }: ReportDetailModalProps) {
  const { approveReport, rejectReport, deleteReport } = useReports();
  const { notify, confirm } = useNotifications();

  const [fullReport, setFullReport] = useState<FloodReport>(report);
  const [loadingImages, setLoadingImages] = useState(true);
  
  const [aiPrediction, setAiPrediction] = useState<{className: string, probability: number} | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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

        const mainImage = full.imageUrls?.[0] || full.imageUrl;
        if (isAdmin && mainImage) {
          setIsAiLoading(true);
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = mainImage;
          img.onload = async () => {
             if (cancelled) return;
             const predictions = await predictImage(img);
             if (predictions && predictions.length > 0) {
               setAiPrediction(predictions[0]);
             }
             setIsAiLoading(false);
          };
          img.onerror = () => setIsAiLoading(false);
        }
      })
      .catch(() => {
      })
      .finally(() => {
        if (!cancelled) setLoadingImages(false);
      });
    return () => { cancelled = true; };
  }, [report, isAdmin]);

  return (
    <div className="fixed inset-0 z-2000 flex items-end md:items-center justify-center p-0 md:p-6">
      <div
        className="absolute inset-0 bg-[#003B6D]/40 backdrop-blur-md animate-backdrop-in"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[40px] shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[90svh] md:max-h-[85vh] animate-slide-up md:animate-scale-in">
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

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

          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-6 md:right-6 p-2 md:p-3 bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl text-gray-500 hover:text-red-500 transition-all hover:scale-110"
          >
            <X size={18} />
          </button>

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

        <div className="p-5 md:p-8 flex flex-col gap-4 md:gap-6 overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-lg md:text-2xl font-black text-[#003B6D] mb-1 md:mb-2 leading-tight">
              {fullReport.reporterName || 'Anonim'}
            </h3>
            <p className="text-gray-500 text-xs md:text-sm leading-relaxed italic">
              "{fullReport.description || 'Tidak ada deskripsi tambahan'}"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center gap-3 md:gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm text-[#005a9e]">
                <User size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Pelapor</span>
                <span className="text-sm font-bold text-[#003B6D]">{fullReport.reporterName || 'Anonim'}</span>
              </div>
            </div>

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

          {isAdmin && isAiLoading ? (
            <div className="bg-indigo-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-indigo-100 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              <span className="text-xs font-bold text-indigo-700">AI sedang menganalisis gambar...</span>
            </div>
          ) : isAdmin && aiPrediction ? (
            <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl border flex items-center justify-between ${
               aiPrediction.className.toLowerCase().includes("bukan") || aiPrediction.className.toLowerCase().includes("tidak")
                 ? "bg-red-50 border-red-100" 
                 : "bg-emerald-50 border-emerald-100"
            }`}>
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-2.5 bg-white rounded-xl shadow-sm ${
                   aiPrediction.className.toLowerCase().includes("bukan") || aiPrediction.className.toLowerCase().includes("tidak")
                     ? "text-red-500"
                     : "text-emerald-500"
                }`}>
                  <Bot size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Rekomendasi AI</span>
                  <span className={`text-sm font-bold ${
                     aiPrediction.className.toLowerCase().includes("bukan") || aiPrediction.className.toLowerCase().includes("tidak")
                     ? "text-red-700"
                     : "text-emerald-700"
                  }`}>
                    {aiPrediction.className} ({(aiPrediction.probability * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                 aiPrediction.className.toLowerCase().includes("bukan") || aiPrediction.className.toLowerCase().includes("tidak")
                 ? "bg-red-500 text-white"
                 : "bg-emerald-500 text-white"
              }`}>
                {aiPrediction.className.toLowerCase().includes("bukan") || aiPrediction.className.toLowerCase().includes("tidak") ? "Indikasi Spam" : "Valid"}
              </span>
            </div>
          ) : null}

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

          <div className="bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center gap-3 md:gap-4">
            <div className="p-2.5 bg-white rounded-xl shadow-sm text-[#005a9e]">
              <MapPin size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Lokasi Laporan</span>
              <span className="text-sm font-bold text-[#003B6D]">
                {getDistrictFromCoords(fullReport.latitude, fullReport.longitude)}
              </span>
            </div>
          </div>

          {isAdmin && fullReport.status === 'pending' ? (
            <div className="flex flex-col gap-3 mt-2 pb-2">
              <button 
                onClick={async () => {
                  try {
                    await approveReport(fullReport.id);
                    notify("success", "Laporan berhasil diverifikasi.");
                    onClose();
                  } catch {
                    notify("error", "Gagal memverifikasi laporan.");
                  }
                }}
                className="w-full py-4 bg-[#16A34A] text-white rounded-2xl font-bold hover:bg-[#15803d] shadow-xl shadow-[#16A34A]/30 transition-all active:scale-[0.98] uppercase text-sm tracking-widest flex items-center justify-center gap-2.5"
              >
                <Check size={18} />
                <span>Konfirmasi Verifikasi</span>
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    confirm({
                      title: "Tolak Laporan?",
                      message: "Apakah Anda yakin ingin menolak laporan ini?",
                      confirmText: "Ya, Tolak",
                      onConfirm: async () => {
                        try {
                          await rejectReport(fullReport.id);
                          notify("success", "Laporan berhasil ditolak.");
                          onClose();
                        } catch {
                          notify("error", "Gagal menolak laporan.");
                        }
                      }
                    });
                  }}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-md transition-all active:scale-[0.98] uppercase text-xs tracking-widest flex items-center justify-center gap-1.5"
                >
                  <XCircle size={16} />
                  <span>Tolak Laporan</span>
                </button>
                <button 
                  onClick={() => {
                    confirm({
                      title: "Hapus Permanen?",
                      message: "Hapus laporan ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
                      confirmText: "Hapus",
                      onConfirm: async () => {
                        try {
                          await deleteReport(fullReport.id);
                          notify("success", "Laporan berhasil dihapus.");
                          onClose();
                        } catch {
                          notify("error", "Gagal menghapus laporan.");
                        }
                      }
                    });
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 shadow-sm transition-all active:scale-[0.98] uppercase text-xs tracking-widest flex items-center justify-center gap-1.5 border border-gray-200 hover:border-red-100"
                >
                  <Trash2 size={16} />
                  <span>Hapus</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-2 py-3 bg-transparent text-gray-400 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-500 transition-all uppercase text-xs tracking-widest"
              >
                Tutup
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl font-bold hover:bg-gray-100 hover:text-gray-500 transition-all active:scale-[0.98] uppercase text-xs tracking-widest border border-gray-100"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
