import { createContext } from "react";

export interface FloodReport {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "low" | "moderate" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
  imageUrl?: string;
  imageUrls?: string[];
  reporterName: string;
  reporterContact?: string;
  markerColor?: string;
  createdAt: Date;
}

export interface ReportFilters {
  from?: string;
  to?: string;
  status?: string;
}

export interface ReportsContextType {
  reports: FloodReport[];
  pendingReports: FloodReport[];
  allReports: FloodReport[];
  loading: boolean;
  addReport: (report: Omit<FloodReport, "id" | "status" | "createdAt">, accuracy: number) => Promise<void>;
  approveReport: (id: string) => Promise<void>;
  rejectReport: (id: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  refreshReports: () => Promise<void>;
  refreshPending: () => Promise<void>;
  refreshAll: (filters?: ReportFilters) => Promise<void>;
}

export const ReportsContext = createContext<ReportsContextType | undefined>(undefined);
