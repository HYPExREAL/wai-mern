import axios from "axios";
import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { ReportsContext, type FloodReport, type ReportFilters } from "./reportsContextDef";
import apiClient from "../api/apiClient";

interface BackendReport {
  _id: string;
  title: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  severity: FloodReport["severity"];
  status: FloodReport["status"];
  imageUrl?: string;
  imageUrls?: string[];
  reporterName: string;
  reporterContact?: string;
  markerColor?: string;
  createdAt: string;
}

// Helper to transform backend GeoJSON to frontend flat structure
const transformReport = (data: BackendReport): FloodReport => ({
  id: data._id,
  title: data.title,
  description: data.description,
  latitude: data.location.coordinates[1],
  longitude: data.location.coordinates[0],
  severity: data.severity,
  status: data.status,
  imageUrl: data.imageUrl,
  imageUrls: data.imageUrls,
  reporterName: data.reporterName,
  reporterContact: data.reporterContact,
  markerColor: data.markerColor,
  createdAt: new Date(data.createdAt),
});

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [pendingReports, setPendingReports] = useState<FloodReport[]>([]);
  const [allReports, setAllReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/reports/published");
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

  const refreshAll = useCallback(async (filters?: ReportFilters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.from) params.set("from", filters.from);
      if (filters?.to) params.set("to", filters.to);
      if (filters?.status) params.set("status", filters.status);
      const query = params.toString();
      const res = await apiClient.get(`/reports/all${query ? `?${query}` : ""}`);
      setAllReports(res.data.map(transformReport));
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
    }
  }, [refreshReports, refreshPending]);

  const rejectReport = useCallback(async (id: string) => {
    try {
      await apiClient.patch(`/reports/${id}/status`, { status: "rejected" });
      await refreshPending();
    } catch (err: unknown) {
      console.error("Gagal menolak laporan:", err);
    }
  }, [refreshPending]);

  const deleteReport = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/reports/${id}`);
      await Promise.all([refreshReports(), refreshPending()]);
    } catch (err: unknown) {
      console.error("Gagal menghapus laporan:", err);
    }
  }, [refreshReports, refreshPending]);

  // Initial fetch — inline the API call so all setState happens in async callbacks,
  // avoiding the React 19 "synchronous setState in effect" warning.
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
