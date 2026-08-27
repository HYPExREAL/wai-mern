import { useMemo, useState } from "react";
import { useReports } from "../hooks/useReports";
import { formatDepth, getSeverityFromDepth } from "../utils/depthUtils";
import { getDistrictFromCoords } from "../utils/locationUtils";
import { BarChart3, CheckCircle, XCircle, AlertTriangle, Layers, MapPin, TrendingUp } from "lucide-react";
import AdminLayout from "./AdminLayout";

export default function AdminStatistics() {
  const { allReports } = useReports();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Semua Wilayah");

  const availableDistricts = ["Semua Wilayah", "Panjang", "Teluk Betung", "Rajabasa", "Way Halim", "Sukabumi", "Kemiling", "Tanjung Karang"];

  const filteredReports = useMemo(() => {
    if (selectedDistrict === "Semua Wilayah") return allReports;
    return allReports.filter((r) => getDistrictFromCoords(r.latitude, r.longitude) === selectedDistrict);
  }, [allReports, selectedDistrict]);

  const globalDistricts = useMemo(() => {
    const districtCount: Record<string, number> = {};
    allReports.forEach((r) => {
      const district = getDistrictFromCoords(r.latitude, r.longitude);
      districtCount[district] = (districtCount[district] || 0) + 1;
    });
    return Object.entries(districtCount)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [allReports]);

  const stats = useMemo(() => {
    const total = filteredReports.length;
    const approved = filteredReports.filter((r) => r.status === "approved").length;
    const rejected = filteredReports.filter((r) => r.status === "rejected").length;
    const pending = filteredReports.filter((r) => r.status === "pending").length;

    let totalDepth = 0;
    let maxDepth = 0;
    const severityCount = {
      Rendah: 0,
      Sedang: 0,
      Tinggi: 0,
      Kritis: 0,
    };

    const trendMap: Record<string, { label: string; count: number; ts: number }> = {};

    filteredReports.forEach((r) => {
      const depth = r.severity || 0;
      totalDepth += depth;
      if (depth > maxDepth) maxDepth = depth;
      
      const sev = getSeverityFromDepth(depth);
      if (sev.label in severityCount)
        severityCount[sev.label as keyof typeof severityCount]++;

      const date = new Date(r.createdAt);
      const monthYear = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      if (!trendMap[monthYear]) {
        trendMap[monthYear] = { label: monthYear, count: 0, ts: date.getTime() };
      }
      trendMap[monthYear].count++;
    });

    const sortedTrends = Object.values(trendMap).sort((a, b) => a.ts - b.ts);

    return {
      total,
      approved,
      rejected,
      pending,
      avgDepth: total > 0 ? totalDepth / total : 0,
      maxDepth,
      severityCount,
      trends: sortedTrends,
    };
  }, [filteredReports]);

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
    <AdminLayout title="Statistik Laporan" subtitle="Akses informasi statistik dari data yang masuk">
      <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto pb-8">
        <div className="flex justify-end items-center mb-2">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-500">Filter Wilayah:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="text-sm font-black text-[#005a9e] bg-transparent border-none outline-none cursor-pointer focus:ring-0 appearance-none pr-4"
            >
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

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
          <div className="bg-white p-6 md:p-8 rounded-32px shadow-sm border border-gray-100 flex flex-col gap-6">
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
          <div className="bg-white p-6 md:p-8 rounded-32px shadow-sm border border-gray-100 flex flex-col gap-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 md:p-8 rounded-32px shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#003B6D]">Laporan Berdasarkan Wilayah</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              {globalDistricts.length > 0 ? (
                globalDistricts.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-700">{item.label}</span>
                      <span className="text-sm font-black text-[#005a9e]">{item.count} Laporan</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
                        style={{ width: `${(item.count / globalDistricts[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-6 text-sm font-semibold">Belum ada data wilayah</div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-32px shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#003B6D]">Tren Laporan (Bulanan)</h3>
            </div>
            
            <div className="flex flex-col justify-end gap-3 h-full min-h-200px pt-4">
              {stats.trends.length > 0 ? (
                <div className="flex items-end gap-2 h-full mt-auto">
                  {stats.trends.map((item) => {
                    const maxTrend = Math.max(...stats.trends.map((t) => t.count));
                    const heightPct = Math.max((item.count / maxTrend) * 100, 5);
                    return (
                      <div key={item.label} className="flex flex-col items-center gap-2 flex-1 group">
                        <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                        <div className="w-full rounded-t-lg relative overflow-hidden flex flex-col justify-end" style={{ height: "120px" }}>
                           <div className="w-full bg-[#005a9e] transition-all duration-1000 rounded-t-sm opacity-80 hover:opacity-100" style={{ height: `${heightPct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center px-1" title={item.label}>
                          {item.label.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-6 text-sm font-semibold m-auto">Belum ada data tren</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
