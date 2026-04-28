import { Link, useLocation } from "react-router-dom";
import { CheckSquare, History, ExternalLink } from "lucide-react";
import { useReports } from "../hooks/useReports";

interface AdminSidebarProps {
  onReportClick?: (lat: number, lng: number) => void;
}

export default function AdminSidebar({ onReportClick }: AdminSidebarProps) {
  const { pendingReports, approveReport } = useReports();
  const location = useLocation();
  const isHistoryPage = location.pathname === "/admin/history";

  const handleVerify = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    approveReport(id);
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
                
                <div className="flex justify-end">
                  <button
                    onClick={(e) => handleVerify(report.id, e)}
                    className="bg-[#005a9e] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-[#004a82] transition-colors shadow-lg shadow-[#005a9e]/20"
                  >
                    <span>Verifikasi</span>
                    <ExternalLink className="w-3 h-3" />
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
    </aside>
  );
}
