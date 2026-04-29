import { useState, useEffect, useCallback, type ReactNode } from "react";
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

  const addReport = async (
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
    } catch (err: unknown) {
      console.error("Gagal mengirim laporan:", err);
      throw err;
    }
  };

  const approveReport = async (id: string) => {
    try {
      await apiClient.patch(`/reports/${id}/status`, { status: "approved" });
      await Promise.all([refreshReports(), refreshPending()]);
    } catch (err: unknown) {
      console.error("Gagal verifikasi laporan:", err);
    }
  };

  const rejectReport = async (id: string) => {
    try {
      await apiClient.patch(`/reports/${id}/status`, { status: "rejected" });
      await refreshPending();
    } catch (err: unknown) {
      console.error("Gagal menolak laporan:", err);
    }
  };

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

  return (
    <ReportsContext.Provider
      value={{
        reports,
        pendingReports,
        loading,
        addReport,
        approveReport,
        rejectReport,
        refreshReports,
        refreshPending,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
}
