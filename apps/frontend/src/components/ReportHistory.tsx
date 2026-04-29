import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useReports } from "../hooks/useReports";
import AdminSidebar from "./AdminSidebar";
import { useEffect } from "react";

export default function ReportHistory() {
  const { reports, refreshReports, refreshPending } = useReports();
  const navigate = useNavigate();

  useEffect(() => {
    refreshReports();
    refreshPending();
  }, [refreshReports, refreshPending]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden relative">
      
      {/* ── LEFT: Sidebar (Shared) ────────────────────────────── */}
      <AdminSidebar />

      {/* ── RIGHT: Content ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col p-10 z-10 overflow-hidden">
        
        {/* Header Area */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[#005a9e] text-4xl font-black tracking-tight">Riwayat Laporan</h1>
          
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all font-bold text-sm uppercase tracking-wider"
          >
            <span>Logout</span>
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Data Card */}
        <div className="flex-1 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
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
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                      Belum ada data laporan tersedia
                    </td>
                  </tr>
                ) : (
                  reports.map((report, idx) => (
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
        </div>
      </main>
    </div>
  );
}
