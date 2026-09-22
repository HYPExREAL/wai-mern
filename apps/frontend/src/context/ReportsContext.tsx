import axios from "axios";
import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { ReportsContext, type FloodReport, type ReportFilters } from "./reportsContextDef";
import apiClient from "../api/apiClient";
import { transformReport } from "../utils/transformReport.ts";

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [pendingReports, setPendingReports] = useState<FloodReport[]>([]);
  const [allReports, setAllReports] = useState<FloodReport[]>([]);
  const [allReportsPagination, setAllReportsPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const refreshReports = useCallback(async (bounds?: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (bounds) {
        params.set("minLng", bounds.minLng.toString());
        params.set("minLat", bounds.minLat.toString());
        params.set("maxLng", bounds.maxLng.toString());
        params.set("maxLat", bounds.maxLat.toString());
      }
      const query = params.toString();
      const res = await apiClient.get(`/reports/published${query ? `?${query}` : ""}`);
      setReports(res.data.map(transformReport));
    } catch (err: unknown) {
      console.error("Gagal mengambil laporan publik:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/reports/pending");
      setPendingReports(res.data.map(transformReport));
    } catch (err: unknown) {
      console.error("Gagal mengambil laporan tertunda:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async (filters?: ReportFilters, page = 1, limit = 10) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      if (filters?.status) params.set("status", filters.status);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      
      const query = params.toString();
      const res = await apiClient.get(`/reports/all${query ? `?${query}` : ""}`);
      setAllReports(res.data.data.map(transformReport));
      setAllReportsPagination({
        total: res.data.total,
        page: res.data.page,
        totalPages: res.data.totalPages,
      });
    } catch (err: unknown) {
      console.error("Gagal mengambil semua laporan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addReport = useCallback(async (
    report: Omit<FloodReport, "id" | "status" | "createdAt">,
    accuracy: number
  ) => {
    try {
      await apiClient.post("/reports", {
        ...report,
        gps_accuracy: accuracy,
        location: {
          type: "Point",
          coordinates: [report.longitude, report.latitude],
        },
      });
      await refreshReports();
      if (localStorage.getItem("token")) {
        await refreshPending();
      }
    } catch (err: unknown) {
      let msg = "Gagal mengirim laporan";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      console.error(msg, err);
      throw err;
    }
  }, [refreshReports, refreshPending]);

  const approveReport = useCallback(async (id: string) => {
    try {
      await apiClient.patch(`/reports/${id}/status`, { status: "approved" });
      await Promise.all([refreshReports(), refreshPending()]);
    } catch (err: unknown) {
      console.error("Gagal verifikasi laporan:", err);
      throw err;
    }
  }, [refreshReports, refreshPending]);

  const rejectReport = useCallback(async (id: string) => {
    try {
      await apiClient.patch(`/reports/${id}/status`, { status: "rejected" });
      await refreshPending();
    } catch (err: unknown) {
      console.error("Gagal menolak laporan:", err);
      throw err;
    }
  }, [refreshPending]);

  const deleteReport = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/reports/${id}`);
      await Promise.all([refreshReports(), refreshPending()]);
    } catch (err: unknown) {
      console.error("Gagal menghapus laporan:", err);
      throw err;
    }
  }, [refreshReports, refreshPending]);

  useEffect(() => {
    let cancelled = false;
    apiClient.get("/reports/published")
      .then(res => { if (!cancelled) setReports(res.data.map(transformReport)); })
      .catch(err => console.error("Gagal mengambil laporan publik:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const contextValue = useMemo(() => ({
    reports,
    pendingReports,
    allReports,
    allReportsPagination,
    loading,
    addReport,
    approveReport,
    rejectReport,
    deleteReport,
    refreshReports,
    refreshPending,
    refreshAll,
  }), [
    reports,
    pendingReports,
    allReports,
    allReportsPagination,
    loading,
    addReport,
    approveReport,
    rejectReport,
    deleteReport,
    refreshReports,
    refreshPending,
    refreshAll,
  ]);

  return (
    <ReportsContext.Provider value={contextValue}>
      {children}
    </ReportsContext.Provider>
  );
}
