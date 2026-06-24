import { useState, useMemo } from "react";
import { useReports } from "../hooks/useReports";
import AdminSidebar from "./AdminSidebar";
import { formatDepth, getSeverityFromDepth } from "../utils/depthUtils";
import { BarChart3, CheckCircle, XCircle, AlertTriangle, Layers, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminStatistics() {
  const { allReports } = useReports();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("token");
    navigate("/");
  };

  // ── Calculate Statistics ────────────────────────────────────
  const stats = useMemo(() => {
    const total = allReports.length;
    const approved = allReports.filter((r) => r.status === "approved").length;
    const rejected = allReports.filter((r) => r.status === "rejected").length;
    const pending = allReports.filter((r) => r.status === "pending").length;

    let totalDepth = 0;
    let maxDepth = 0;
    const severityCount = {
      Rendah: 0,
      Sedang: 0,
      Tinggi: 0,
      Kritis: 0,
    };

    allReports.forEach((r) => {
      totalDepth += r.severity;
      if (r.severity > maxDepth) maxDepth = r.severity;
      const severity = getSeverityFromDepth(r.severity).label;
      if (severity === "Rendah") severityCount.Rendah++;
      else if (severity === "Sedang") severityCount.Sedang++;
      else if (severity === "Tinggi") severityCount.Tinggi++;
      else if (severity === "Kritis") severityCount.Kritis++;
    });

    const avgDepth = total > 0 ? totalDepth / total : 0;

    return {
      total,
      approved,
      rejected,
      pending,
      avgDepth,
      maxDepth,
      severityCount,
    };
  }, [allReports]);

  // For the bar chart percentages
  const getMaxSeverityCount = () => {
    const max = Math.max(
      stats.severityCount.Rendah,
      stats.severityCount.Sedang,
      stats.severityCount.Tinggi,
      stats.severityCount.Kritis
    );
    return max > 0 ? max : 1;
  };

  return (
    <div className="flex h-svh w-full bg-gray-100 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 h-full bg-gray-100 transition-all duration-300 ease-in-out overflow-hidden shadow-2xl md:shadow-none
        ${sidebarOpen ? 'w-[85vw] md:w-[380px]' : 'w-0'}
        md:relative
      `}
      >
        <div className="w-[85vw] md:w-[380px] h-full">
          <AdminSidebar />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-10 z-10 overflow-y-auto custom-scrollbar">
        {/* Header Area */}
        <div className="flex justify-between items-start md:items-center mb-6 md:mb-8 max-w-6xl w-full mx-auto">
          <div className="flex items-start md:items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 bg-white rounded-xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all shrink-0 mt-1 md:mt-0"
            >
              <Menu className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="flex flex-col gap-0.5 md:gap-1">
              <h1 className="text-[#005a9e] text-xl md:text-4xl font-black tracking-tight">Statistik Laporan</h1>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Ringkasan data banjir di Bandar Lampung</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-3 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 text-[#005a9e] hover:bg-gray-50 transition-all font-bold text-xs md:text-sm uppercase tracking-wider shrink-0"
          >
            <span className="hidden sm:inline">Logout</span>
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto pb-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-3 text-[#005a9e]">
                <div className="p-2.5 bg-[#005a9e]/10 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Total</span>
              </div>
              <span className="text-3xl font-black text-[#003B6D]">{stats.total}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Valid</span>
              </div>
              <span className="text-3xl font-black text-[#003B6D]">{stats.approved}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-3 text-amber-500">
                <div className="p-2.5 bg-amber-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tertunda</span>
              </div>
              <span className="text-3xl font-black text-[#003B6D]">{stats.pending}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center gap-3 text-red-500">
                <div className="p-2.5 bg-red-50 rounded-xl">
                  <XCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Ditolak</span>
              </div>
              <span className="text-3xl font-black text-[#003B6D]">{stats.rejected}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Depth Analytics */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2 bg-[#005a9e]/10 text-[#005a9e] rounded-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-[#003B6D]">Analisis Kedalaman</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rata-rata</span>
                  <span className="text-3xl font-black text-[#005a9e]">{formatDepth(Math.round(stats.avgDepth))}</span>
                </div>
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Maksimal</span>
                  <span className="text-3xl font-black text-red-600">{formatDepth(stats.maxDepth)}</span>
                </div>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-[#003B6D]">Distribusi Tingkat Bahaya</h3>
              </div>
              
              <div className="flex flex-col gap-4">
                {[
                  { label: "Kritis", count: stats.severityCount.Kritis, color: "bg-red-500", text: "text-red-700" },
                  { label: "Tinggi", count: stats.severityCount.Tinggi, color: "bg-orange-500", text: "text-orange-700" },
                  { label: "Sedang", count: stats.severityCount.Sedang, color: "bg-amber-400", text: "text-amber-700" },
                  { label: "Rendah", count: stats.severityCount.Rendah, color: "bg-emerald-500", text: "text-emerald-700" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end">
                      <span className={`text-xs font-bold uppercase tracking-wider ${item.text}`}>{item.label}</span>
                      <span className="text-sm font-black text-gray-700">{item.count} Laporan</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out`}
                        style={{ width: `${(item.count / getMaxSeverityCount()) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
