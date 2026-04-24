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
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date(),
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const verifyReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "verified" } : r))
    );
  };

  const rejectReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
  };

  return (
    <ReportsContext.Provider
      value={{ reports, pendingReports, addReport, verifyReport, rejectReport }}
    >
      {children}
    </ReportsContext.Provider>
  );
}
