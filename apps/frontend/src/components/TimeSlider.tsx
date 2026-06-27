import { useMemo, useEffect, useState } from "react";
import { History } from "lucide-react";
import type { FloodReport } from "../context/reportsContextDef";

interface TimeSliderProps {
  reports: FloodReport[];
  onFilterChange: (filtered: FloodReport[]) => void;
}

export default function TimeSlider({ reports, onFilterChange }: TimeSliderProps) {
  // Extract and sort unique months from reports (YYYY-MM format)
  const months = useMemo(() => {
    const m = new Set<string>();
    reports.forEach((r) => {
      // Use the native createdAt timestamp from the backend
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        m.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
    });
    return Array.from(m).sort();
  }, [reports]);

  const [sliderIndex, setSliderIndex] = useState<number>(-1); // -1 means "Show All"

  // Whenever the slider changes, filter the reports
  useEffect(() => {
    if (sliderIndex === -1 || months.length === 0) {
      onFilterChange(reports);
    } else {
      const activeMonth = months[sliderIndex];
      const filtered = reports.filter((r) => {
        const d = new Date(r.createdAt);
        if (isNaN(d.getTime())) return false;
        const rMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return rMonth === activeMonth;
      });
      onFilterChange(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderIndex, months, reports]);

  const formatMonth = (yyyMM: string) => {
    const [year, month] = yyyMM.split("-");
    const date = new Date(parseInt(year!), parseInt(month!) - 1);
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  if (months.length === 0) return null;

  return (
    <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-1000 w-[90%] max-w-md">
      <div className="bg-white/95 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[#005a9e]">
            <History className="w-4 h-4 md:w-5 md:h-5" />
            <span className="font-bold text-xs md:text-sm uppercase tracking-wider">Histori Waktu (Timeliness)</span>
          </div>
          <span className="text-xs md:text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {sliderIndex === -1 ? "Semua Waktu" : formatMonth(months[sliderIndex]!)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSliderIndex(-1)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              sliderIndex === -1 ? "bg-[#005a9e] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          
          <input
            type="range"
            min="-1"
            max={months.length - 1}
            step="1"
            value={sliderIndex}
            onChange={(e) => setSliderIndex(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005a9e]"
          />
        </div>
        
        <div className="flex justify-between mt-2 px-[60px]">
          <span className="text-[9px] text-gray-400 font-medium">{formatMonth(months[0]!)}</span>
          {months.length > 1 && (
            <span className="text-[9px] text-gray-400 font-medium">{formatMonth(months[months.length - 1]!)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
