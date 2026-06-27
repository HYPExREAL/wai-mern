import { useMemo, useEffect, useState } from "react";
import { History } from "lucide-react";
import type { FloodReport } from "../context/reportsContextDef";

interface TimeSliderProps {
  reports: FloodReport[];
  onFilterChange: (filtered: FloodReport[]) => void;
}

export default function TimeSlider({ reports, onFilterChange }: TimeSliderProps) {
  // Generate a continuous array of all months between the earliest and latest report
  const months = useMemo(() => {
    if (!reports || reports.length === 0) return [];

    let minDate = new Date(reports[0].createdAt);
    let maxDate = new Date(reports[0].createdAt);

    reports.forEach((r) => {
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      }
    });

    const result: string[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      result.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
      current.setMonth(current.getMonth() + 1);
    }
    
    return result;
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
    return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  };

  if (months.length === 0) return null;

  return (
    <div className="absolute top-24 md:top-auto md:bottom-8 left-1/2 -translate-x-1/2 z-1000 w-[90%] max-w-[340px] pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[#005a9e]">
            <History className="w-4 h-4" />
            <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider">Histori Waktu</span>
          </div>
          <span className="text-[10px] font-bold text-[#005a9e] bg-[#005a9e]/10 px-2.5 py-1 rounded-full">
            {sliderIndex === -1 ? "Semua Waktu" : formatMonth(months[sliderIndex]!)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSliderIndex(-1)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 ${
              sliderIndex === -1 ? "bg-[#005a9e] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          
          <div className="flex-1 relative flex items-center h-4">
            <input
              type="range"
              min="-1"
              max={months.length - 1}
              step="1"
              value={sliderIndex}
              onChange={(e) => setSliderIndex(parseInt(e.target.value))}
              className="absolute w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005a9e] z-10"
            />
          </div>
        </div>
        
        <div className="flex justify-between mt-1 px-11">
          <span className="text-[8px] text-gray-400 font-medium">{formatMonth(months[0]!)}</span>
          {months.length > 1 && (
            <span className="text-[8px] text-gray-400 font-medium">{formatMonth(months[months.length - 1]!)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
