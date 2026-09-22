import { Filter, Download, ChevronDown, Calendar, Eye, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { FloodReport } from "../context/reportsContextDef";
import { useReports } from "../hooks/useReports";
import { useEffect, useState, useCallback } from "react";
import { exportToCSV, exportToXLSX, exportToGeoJSON } from "../utils/exportReports";
import { formatDepth, getSeverityFromDepth } from "../utils/depthUtils";
import { useNotifications } from "../context/notificationContextDef";
import ReportDetailModal from "./ReportDetailModal";
import AdminLayout from "./AdminLayout";

export default function ReportHistory() {
  const { allReports, allReportsPagination, refreshAll, refreshPending, deleteReport } = useReports();
  const { confirm, notify } = useNotifications();

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(null);
  
  const [page, setPage] = useState(1);

  const getPageNumbers = () => {
    const total = allReportsPagination.totalPages;
    const current = page;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (current <= 3) {
      end = Math.min(total, 5);
    } else if (current >= total - 2) {
      start = Math.max(1, total - 4);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const fetchFiltered = useCallback(() => {
    const filters: Record<string, string> = {};
    if (filterFrom) filters.from = filterFrom;
    if (filterTo) filters.to = filterTo;
    if (filterStatus) filters.status = filterStatus;
    refreshAll(Object.keys(filters).length > 0 ? filters : undefined, page);
  }, [filterFrom, filterTo, filterStatus, page, refreshAll]);

  useEffect(() => {
    fetchFiltered();
    refreshPending();
  }, [fetchFiltered, refreshPending]);

  const clearFilters = () => {
    setFilterFrom("");
    setFilterTo("");
    setFilterStatus("");
    setPage(1);
  };

  const hasActiveFilters = filterFrom || filterTo || filterStatus;

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

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    confirm({
      title: "Hapus Laporan",
      message: `Apakah Anda yakin ingin menghapus laporan dari ${name || "Anonim"}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Ya, Hapus",
      onConfirm: async () => {
        try {
          await deleteReport(id);
          notify("success", "Laporan berhasil dihapus.");
          fetchFiltered();
        } catch {
          notify("error", "Gagal menghapus laporan.");
        }
      }
    });
  };

  return (
    <AdminLayout title="Riwayat Laporan" subtitle="Akses seluruh riwayat laporan masuk">

      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm border ${
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

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={allReports.length === 0}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white text-[#005a9e] border border-gray-100 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 min-w-[160px]">
                <button onClick={() => handleExport("xlsx")} className="cursor-pointer w-full text-left px-4 py-3 text-sm font-bold text-[#003B6D] hover:bg-[#005a9e]/5 transition-colors flex items-center gap-3 border-b border-gray-50">
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black">XLSX</span>
                  Excel
                </button>
                <button onClick={() => handleExport("csv")} className="cursor-pointer w-full text-left px-4 py-3 text-sm font-bold text-[#003B6D] hover:bg-[#005a9e]/5 transition-colors flex items-center gap-3 border-b border-gray-50">
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">CSV</span>
                  Comma Separated
                </button>
                <button onClick={() => handleExport("geojson")} className="cursor-pointer w-full text-left px-4 py-3 text-sm font-bold text-[#003B6D] hover:bg-[#005a9e]/5 transition-colors flex items-center gap-3">
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black">GEO</span>
                  GeoJSON
                </button>
              </div>
            </>
          )}
        </div>

        <span className="text-xs text-gray-400 font-bold ml-auto">
          {allReports.length} laporan
        </span>
      </div>

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
                onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
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
                onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#003B6D] focus:border-[#005a9e] focus:ring-2 focus:ring-[#005a9e]/10 outline-none transition-all"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[#005a9e] text-[10px] font-bold uppercase tracking-widest">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
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
              className="cursor-pointer shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      )}

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
                <th className="px-8 py-6 text-[#005a9e] font-black uppercase tracking-wider text-xs text-right">Aksi</th>
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
                    <td className="px-8 py-5 text-sm font-bold text-gray-900">{(allReportsPagination.page - 1) * 10 + idx + 1}</td>
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
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }} className="p-2 text-gray-400 hover:text-[#005a9e] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Lihat Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(e, report.id, report.reporterName)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus Laporan">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleDelete(e, report.id, report.reporterName)} className="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {allReportsPagination.totalPages > 1 && (
          <div className="flex items-center justify-center md:justify-start gap-1 p-6 border-t border-gray-100 bg-white rounded-b-[32px]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            {getPageNumbers().map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3.5 py-1.5 border rounded-md text-sm font-medium cursor-pointer transition-colors ${
                  page === p 
                    ? "bg-black text-white border-black" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(allReportsPagination.totalPages, p + 1))}
              disabled={page === allReportsPagination.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </AdminLayout>
  );
}
