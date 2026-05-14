import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useReports } from "../hooks/useReports";
import AdminSidebar from "./AdminSidebar";
import { useEffect, useState } from "react";

export default function ReportHistory() {
  const { allReports, refreshAll, refreshPending } = useReports();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    refreshAll();
    refreshPending();
  }, [refreshAll, refreshPending]);

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

      {/* ── LEFT: Sidebar (Shared) ────────────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-[85vw] max-w-[380px] transform transition-transform duration-300 ease-in-out bg-gray-100
        md:relative md:translate-x-0 md:w-[380px] md:max-w-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar />
      </div>

      {/* ── RIGHT: Content ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col p-4 md:p-10 z-10 overflow-hidden">
        
        {/* Header Area */}
        <div className="flex justify-between items-center mb-4 md:mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-3 bg-white rounded-xl shadow-xl border border-gray-100 text-[#005a9e]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-[#005a9e] text-xl md:text-4xl font-black tracking-tight">Riwayat Laporan</h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-3 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all font-bold text-xs md:text-sm uppercase tracking-wider"
          >
            <span className="hidden sm:inline">Logout</span>
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Data Card — Table on desktop, Cards on mobile */}
        <div className="flex-1 bg-white rounded-[24px] md:rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-8 py-6 text-[#005a9e] font-black uppercase tracking-wider text-xs">No</th>
                  <th className="px-8 py-6 text-[#005a9e] font-black uppercase tracking-wider text-xs">Nama Pelapor</th>
                  <th className="px-8 py-6 text-[#005a9e] font-black uppercase tracking-wider text-xs">Deskripsi</th>
                  <th className="px-8 py-6 text-[#005a9e] font-black uppercase tracking-wider text-xs">Kedalaman</th>
                  <th className="px-8 py-6 text-[#005a9e] font-black uppercase tracking-wider text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                      Belum ada data laporan tersedia
                    </td>
                  </tr>
                ) : (
                  allReports.map((report, idx) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-5 text-sm font-bold text-gray-900">{idx + 1}</td>
                      <td className="px-8 py-5 text-sm font-black text-gray-800">{report.reporterName || "Anonim"}</td>
                      <td className="px-8 py-5 text-sm text-gray-500 max-w-xs truncate">{report.description}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          report.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          report.status === 'approved' ? 'bg-[#16A34A]/10 text-[#16A34A]' :
                          report.status === 'rejected' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                          'bg-[#0ea5e9]/10 text-[#0ea5e9]'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3">
            {allReports.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 font-medium text-sm">
                Belum ada data laporan tersedia
              </div>
            ) : (
              allReports.map((report, idx) => (
                <div key={report.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">#{idx + 1}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      report.status === 'approved' ? 'bg-[#16A34A]/10 text-[#16A34A]' :
                      report.status === 'rejected' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                      'bg-[#0ea5e9]/10 text-[#0ea5e9]'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-gray-800 mb-1">{report.reporterName || "Anonim"}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{report.description}</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                    report.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {report.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
