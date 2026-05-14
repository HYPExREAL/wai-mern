import { useMap } from "react-leaflet";
import { Plus, Minus } from "lucide-react";

export default function ZoomControls() {
  const map = useMap();
  return (
    <div className="flex items-center bg-white rounded-full shadow-xl border border-gray-100 overflow-hidden">
      <button 
        onClick={() => map.zoomOut()}
        className="p-2.5 md:p-3 hover:bg-gray-50 transition-colors text-[#005a9e]"
      >
        <Minus className="w-5 h-5 md:w-6 md:h-6 stroke-3" />
      </button>
      <div className="w-px h-5 md:h-6 bg-gray-200" />
      <button 
        onClick={() => map.zoomIn()}
        className="p-2.5 md:p-3 hover:bg-gray-50 transition-colors text-[#005a9e]"
      >
        <Plus className="w-5 h-5 md:w-6 md:h-6 stroke-3" />
      </button>
    </div>
  );
}
