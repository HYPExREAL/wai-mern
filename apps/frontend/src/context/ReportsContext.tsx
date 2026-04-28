import { useState, type ReactNode } from "react";
import { ReportsContext, type FloodReport } from "./reportsContextDef";

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<FloodReport[]>([]);

  const pendingReports = reports.filter((r) => r.status === "pending");

  const addReport = (
    report: Omit<FloodReport, "id" | "status" | "createdAt">
  ) => {
    const newReport: FloodReport = {
      ...report,
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      status: "pending",
      createdAt: new Date(),
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const approveReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
  };

  const rejectReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
  };

  return (
    <ReportsContext.Provider
      value={{ reports, pendingReports, addReport, approveReport, rejectReport }}
    >
      {children}
    </ReportsContext.Provider>
  );
}
