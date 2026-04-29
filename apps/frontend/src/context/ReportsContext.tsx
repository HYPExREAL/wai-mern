import axios from "axios";
import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { ReportsContext, type FloodReport } from "./reportsContextDef";
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
  reporterName: data.reporterName,
  reporterContact: data.reporterContact,
  markerColor: data.markerColor,
  createdAt: new Date(data.createdAt),
});

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [pendingReports, setPendingReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Initial fetch
  useEffect(() => {
    const initFetch = async () => {
      await refreshReports();
      // If we have a token, we might want to fetch pending as well
      if (localStorage.getItem("token")) {
        await refreshPending();
      }
    };
    
    initFetch();
  }, [refreshReports, refreshPending]);

  const contextValue = useMemo(() => ({
    reports,
    pendingReports,
    loading,
    addReport,
    approveReport,
    rejectReport,
    deleteReport,
    refreshReports,
    refreshPending,
  }), [
    reports,
    pendingReports,
    loading,
    addReport,
    approveReport,
    rejectReport,
    deleteReport,
    refreshReports,
    refreshPending
  ]);

  return (
    <ReportsContext.Provider value={contextValue}>
      {children}
    </ReportsContext.Provider>
  );
}
