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
  reporterName: string;
  reporterContact?: string;
  createdAt: Date;
}

export interface ReportsContextType {
  reports: FloodReport[];
  pendingReports: FloodReport[];
  addReport: (report: Omit<FloodReport, "id" | "status" | "createdAt">) => void;
  approveReport: (id: string) => void;
  rejectReport: (id: string) => void;
}

export const ReportsContext = createContext<ReportsContextType | undefined>(undefined);
