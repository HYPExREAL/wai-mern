import { useNavigate } from "react-router-dom";
import { LogOut, Menu, Filter, Download, ChevronDown, Calendar, X, User, Clock, MapPin, Droplets, Eye } from "lucide-react";
import type { FloodReport } from "../context/reportsContextDef";
import { useReports } from "../hooks/useReports";
import AdminSidebar from "./AdminSidebar";
import { useEffect, useState, useCallback } from "react";
import { exportToCSV, exportToXLSX, exportToGeoJSON } from "../utils/exportReports";
import { formatDepth, getSeverityFromDepth } from "../utils/depthUtils";

export default function ReportHistory() {
  const { allReports, refreshAll, refreshPending } = useReports();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(null);

  const fetchFiltered = useCallback(() => {
    const filters: Record<string, string> = {};
    if (filterFrom) filters.from = filterFrom;
    if (filterTo) filters.to = filterTo;
    if (filterStatus) filters.status = filterStatus;
    refreshAll(Object.keys(filters).length > 0 ? filters : undefined);
  }, [filterFrom, filterTo, filterStatus, refreshAll]);

  useEffect(() => {
    fetchFiltered();
    refreshPending();
  }, [fetchFiltered, refreshPending]);

  const clearFilters = () => {
    setFilterFrom("");
    setFilterTo("");
    setFilterStatus("");
  };

  const hasActiveFilters = filterFrom || filterTo || filterStatus;

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleExport = (format: "csv" | "xlsx" | "geojson") => {
    const dateSuffix = filterFrom || filterTo
      ? `_${filterFrom || "awal"}_sd_${filterTo || "sekarang"}`
      : "";
    const filename = `laporan-banjir${dateSuffix}`;

    if (format === "csv") exportToCSV(allReports, filename);
    else if (format === "xlsx") exportToXLSX(allReports, filename);
    else exportToGeoJSON(allReports, filename);

    setShowExportMenu(false);
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
        <div className="flex justify-between items-center mb-4 md:mb-6">
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

        {/* ── Filter & Export Bar ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm border ${
              showFilters || hasActiveFilters
                ? "bg-[#005a9e] text-white border-[#005a9e]"
                : "bg-white text-[#005a9e] border-gray-100 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && (
              <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">ON</span>
            )}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={allReports.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white text-[#005a9e] border border-gray-100 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 min-w-[160px]">
                  <button onClick={() => handleExport("xlsx")} className="w-full text-left px-4 py-3 text-sm font-bold text-[#003B6D] hover:bg-[#005a9e]/5 transition-colors flex items-center gap-3 border-b border-gray-50">
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black">XLSX</span>
                    Excel
                  </button>
                  <button onClick={() => handleExport("csv")} className="w-full text-left px-4 py-3 text-sm font-bold text-[#003B6D] hover:bg-[#005a9e]/5 transition-colors flex items-center gap-3 border-b border-gray-50">
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">CSV</span>
                    Comma Separated
                  </button>
                  <button onClick={() => handleExport("geojson")} className="w-full text-left px-4 py-3 text-sm font-bold text-[#003B6D] hover:bg-[#005a9e]/5 transition-colors flex items-center gap-3">
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black">GEO</span>
                    GeoJSON
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Report count */}
          <span className="text-xs text-gray-400 font-bold ml-auto">
            {allReports.length} laporan
          </span>
        </div>

        {/* ── Filter Panel (collapsible) ──────────────────────── */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 md:p-5 mb-4 flex flex-col sm:flex-row sm:items-end gap-3 md:gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[#005a9e] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#003B6D] focus:border-[#005a9e] focus:ring-2 focus:ring-[#005a9e]/10 outline-none transition-all"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[#005a9e] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#003B6D] focus:border-[#005a9e] focus:ring-2 focus:ring-[#005a9e]/10 outline-none transition-all"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[#005a9e] text-[10px] font-bold uppercase tracking-widest">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#003B6D] focus:border-[#005a9e] outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Semua</option>
                  <option value="approved">Divalidasi</option>
                  <option value="pending">Menunggu</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        )}

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
                  <th className="px-8 py-6 text-[#005a9e] font-black uppercase tracking-wider text-xs">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-medium">
                      {hasActiveFilters ? "Tidak ada laporan yang sesuai filter" : "Belum ada data laporan tersedia"}
                    </td>
                  </tr>
                ) : (
                  allReports.map((report, idx) => (
                    <tr key={report.id} onClick={() => setSelectedReport(report)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="px-8 py-5 text-sm font-bold text-gray-900">{idx + 1}</td>
                      <td className="px-8 py-5 text-sm font-black text-gray-800">{report.reporterName || "Anonim"}</td>
                      <td className="px-8 py-5 text-sm text-gray-500 max-w-xs truncate">{report.description}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getSeverityFromDepth(report.severity).colorClass}`}>
                          {formatDepth(report.severity)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          report.status === 'approved' ? 'bg-[#16A34A]/10 text-[#16A34A]' :
                          report.status === 'rejected' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                          'bg-[#0ea5e9]/10 text-[#0ea5e9]'
                        }`}>
                          {report.status === 'approved' ? 'Divalidasi' :
                           report.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                            {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <Eye className="w-4 h-4 text-gray-300 group-hover:text-[#005a9e] transition-colors" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3 stagger-children">
            {allReports.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 font-medium text-sm">
                {hasActiveFilters ? "Tidak ada laporan yang sesuai filter" : "Belum ada data laporan tersedia"}
              </div>
            ) : (
              allReports.map((report, idx) => (
                <div key={report.id} onClick={() => setSelectedReport(report)} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 cursor-pointer hover:border-[#005a9e]/20 hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">#{idx + 1}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      report.status === 'approved' ? 'bg-[#16A34A]/10 text-[#16A34A]' :
                      report.status === 'rejected' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                      'bg-[#0ea5e9]/10 text-[#0ea5e9]'
                    }`}>
                      {report.status === 'approved' ? 'Divalidasi' :
                       report.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-gray-800 mb-1">{report.reporterName || "Anonim"}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{report.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getSeverityFromDepth(report.severity).colorClass}`}>
                      {formatDepth(report.severity)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ── Report Detail Modal ──────────────────────────────── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#003B6D]/40 backdrop-blur-md animate-backdrop-in"
            onClick={() => setSelectedReport(null)}
          />

          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[40px] shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[90svh] md:max-h-[85vh] animate-slide-up md:animate-scale-in">
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header / Image Area */}
            <div className="relative w-full aspect-video bg-gray-100 shrink-0 overflow-x-auto flex snap-x snap-mandatory custom-scrollbar">
              {selectedReport.imageUrls && selectedReport.imageUrls.length > 0 ? (
                selectedReport.imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Dokumentasi ${idx + 1}`}
                    className="w-full h-full object-cover shrink-0 snap-center"
                  />
                ))
              ) : selectedReport.imageUrl ? (
                <img
                  src={selectedReport.imageUrl}
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
                onClick={() => setSelectedReport(null)}
                className="absolute top-3 right-3 md:top-6 md:right-6 p-2 md:p-3 bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl text-gray-500 hover:text-red-500 transition-all hover:scale-110"
              >
                <X size={18} />
              </button>

              {/* Status Badge */}
              <div className={`absolute bottom-3 left-3 md:bottom-6 md:left-6 px-3 py-1.5 md:px-4 md:py-2 text-white rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-lg ${
                selectedReport.status === 'approved' ? 'bg-[#16A34A]' :
                selectedReport.status === 'rejected' ? 'bg-[#DC2626]' :
                'bg-amber-500'
              }`}>
                {selectedReport.status === 'approved' ? 'Divalidasi' :
                 selectedReport.status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5 md:p-8 flex flex-col gap-4 md:gap-6 overflow-y-auto custom-scrollbar">
              <div>
                <h3 className="text-lg md:text-2xl font-black text-[#003B6D] mb-1 md:mb-2 leading-tight">
                  {selectedReport.title}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed italic">
                  "{selectedReport.description || 'Tidak ada deskripsi tambahan'}"
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
                    <span className="text-sm font-bold text-[#003B6D]">{selectedReport.reporterName || 'Anonim'}</span>
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
                      {new Date(selectedReport.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Depth Info */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2.5 rounded-xl shadow-sm ${getSeverityFromDepth(selectedReport.severity).colorClass}`}>
                    <Droplets size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Kedalaman</span>
                    <span className="text-sm font-bold text-[#003B6D]">{formatDepth(selectedReport.severity)}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getSeverityFromDepth(selectedReport.severity).colorClass}`}>
                  {getSeverityFromDepth(selectedReport.severity).label}
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
                    {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedReport(null)}
                className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl font-bold hover:bg-gray-100 hover:text-gray-500 transition-all active:scale-[0.98] uppercase text-xs tracking-widest border border-gray-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
