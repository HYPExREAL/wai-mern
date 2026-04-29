import { Link, useLocation } from "react-router-dom";
import { CheckSquare, History, XCircle, Trash2, Check, Clock, MapPin, User, X } from "lucide-react";
import { useState } from "react";
import { useReports } from "../hooks/useReports";

interface AdminSidebarProps {
  onReportClick?: (lat: number, lng: number) => void;
}

export default function AdminSidebar({ onReportClick }: AdminSidebarProps) {
  const { pendingReports, approveReport, rejectReport, deleteReport } = useReports();
  const location = useLocation();
  const isHistoryPage = location.pathname === "/admin/history";

  const [selectedReportForVerification, setSelectedReportForVerification] = useState<typeof pendingReports[0] | null>(null);

  const handleVerifyClick = (report: typeof pendingReports[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReportForVerification(report);
  };

  const handleConfirmApprove = async () => {
    if (!selectedReportForVerification) return;
    try {
      await approveReport(selectedReportForVerification.id);
      setSelectedReportForVerification(null);
    } catch {
      alert("Gagal memverifikasi laporan.");
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menolak laporan ini?")) return;
    try {
      await rejectReport(id);
    } catch {
      alert("Gagal menolak laporan.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus laporan ini secara permanen? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      await deleteReport(id);
    } catch {
      alert("Gagal menghapus laporan.");
    }
  };

  return (
    <aside className="w-[380px] h-full flex flex-col p-6 z-20 pointer-events-none">
      
      {/* Logo Card */}
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 mb-6 pointer-events-auto">
        <Link to="/" className="flex items-center gap-3">
          <img src="/WAI.png" alt="WAI Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col border-l border-gray-200 pl-3">
            <span className="text-[#005a9e] font-bold text-sm tracking-tight leading-none mb-0.5">Water Awareness</span>
            <span className="text-[#005a9e] text-xs font-medium opacity-80 leading-none">& Information</span>
          </div>
        </Link>
      </div>

      {/* Reports List Card */}
      <div className="flex-1 bg-white/95 backdrop-blur-md rounded-[32px] shadow-2xl border border-white/50 p-6 flex flex-col pointer-events-auto overflow-hidden">
        <h2 className="text-[#005a9e] text-lg font-bold text-center mb-6">Laporan Masuk</h2>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {pendingReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <CheckSquare className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Belum ada laporan baru</p>
            </div>
          ) : (
            pendingReports.map((report, idx) => (
              <div 
                key={report.id}
                onClick={() => onReportClick?.(report.latitude, report.longitude)}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#005a9e]/20 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-gray-900 uppercase">Laporan #{idx + 1}</span>
                </div>
                <h3 className="text-sm font-black text-gray-800 mb-0.5">{report.reporterName || "Anonim"}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                  {report.description || "Tidak ada deskripsi"}
                </p>

                {report.imageUrl && (
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-gray-100">
                    <img src={report.imageUrl} alt="Documentation" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleVerifyClick(report, e)}
                    className="flex-1 bg-[#16A34A] text-white py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-[#15803d] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check size={14} />
                    Verifikasi
                  </button>
                  <button 
                    onClick={(e) => handleReject(report.id, e)}
                    className="flex-1 bg-amber-500 text-white py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <XCircle size={14} />
                    Tolak
                  </button>
                  <button 
                    onClick={(e) => handleDelete(report.id, e)}
                    className="aspect-square bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 p-2 rounded-xl transition-all flex items-center justify-center shadow-xs"
                    title="Hapus Laporan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Button */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link 
            to={isHistoryPage ? "/admin/dashboard" : "/admin/history"}
            className={`w-full flex items-center justify-center gap-3 py-3 border-2 border-[#005a9e] rounded-xl font-bold transition-all text-sm ${
              isHistoryPage 
              ? "bg-[#005a9e] text-white hover:bg-[#004a82]" 
              : "text-[#005a9e] hover:bg-[#005a9e]/5"
            }`}
          >
            <span>{isHistoryPage ? "Dashboard Map" : "Riwayat Laporan"}</span>
            <History className="w-5 h-5" />
          </Link>
        </div>
      </div>
      {/* ── Verification Modal ─────────────────────────────────── */}
      {selectedReportForVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-auto">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#003B6D]/40 backdrop-blur-md"
            onClick={() => setSelectedReportForVerification(null)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-white/50 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            {/* Header / Image Area */}
            <div className="relative w-full aspect-video bg-gray-100">
              {selectedReportForVerification.imageUrl ? (
                <img 
                  src={selectedReportForVerification.imageUrl} 
                  alt="Documentation" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <CheckSquare className="w-8 h-8 opacity-20" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Tidak ada foto</span>
                </div>
              )}
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedReportForVerification(null)}
                className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl text-gray-500 hover:text-red-500 transition-all hover:scale-110"
              >
                <X size={20} />
              </button>

              {/* Status Badge */}
              <div className="absolute bottom-6 left-6 px-4 py-2 bg-[#16A34A] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">
                Menunggu Verifikasi
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 flex flex-col gap-6">
              <div>
                <h3 className="text-2xl font-black text-[#003B6D] mb-2 leading-tight">
                  {selectedReportForVerification.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed italic">
                  "{selectedReportForVerification.description || "Tidak ada deskripsi tambahan"}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-[#005a9e]">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Pelapor</span>
                    <span className="text-sm font-bold text-[#003B6D]">{selectedReportForVerification.reporterName || "Anonim"}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-amber-500">
                    <Clock size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Waktu</span>
                    <span className="text-sm font-bold text-[#003B6D]">
                      {new Date(selectedReportForVerification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm text-red-500">
                  <MapPin size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Koordinat</span>
                  <span className="text-sm font-bold text-[#003B6D]">
                    {selectedReportForVerification.latitude.toFixed(5)}, {selectedReportForVerification.longitude.toFixed(5)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => setSelectedReportForVerification(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-3xl font-bold hover:bg-gray-200 transition-all active:scale-95 uppercase text-xs tracking-widest"
                >
                  Kembali
                </button>
                <button 
                  onClick={handleConfirmApprove}
                  className="flex-2 py-4 bg-[#16A34A] text-white rounded-3xl font-bold hover:bg-[#15803d] shadow-xl shadow-[#16A34A]/30 transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Konfirmasi Verifikasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
