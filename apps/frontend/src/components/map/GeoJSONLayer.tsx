import { useState, useEffect } from "react";
import { GeoJSON } from "react-leaflet";
import type L from "leaflet";

interface GeoJSONLayerProps {
  url: string;
  style: L.PathOptions;
}

export default function GeoJSONLayer({ url, style }: GeoJSONLayerProps) {
  const [data, setData] = useState<GeoJSON.GeoJsonObject | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.json();
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((err) => console.warn('GeoJSON load error:', err));
    return () => { cancelled = true; };
  }, [url]);
  if (!data) return null;
  return <GeoJSON key={url} data={data} style={() => style} />;
}
