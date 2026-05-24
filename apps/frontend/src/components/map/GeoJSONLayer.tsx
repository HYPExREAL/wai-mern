import { useState, useEffect, useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";

interface GeoJSONLayerProps {
  url?: string;
  data?: object;
  style: L.PathOptions;
}

export default function GeoJSONLayer({ url, data: rawData, style }: GeoJSONLayerProps) {
  const [fetchedData, setFetchedData] = useState<GeoJSON.GeoJsonObject | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.json();
      })
      .then((json) => { if (!cancelled) setFetchedData(json); })
      .catch((err) => console.warn('GeoJSON load error:', err));
    return () => { cancelled = true; };
  }, [url]);

  const geoData = rawData ? (rawData as GeoJSON.GeoJsonObject) : fetchedData;

  // Render Point features as circle markers using the layer's color
  const pointToLayer = useMemo(() => {
    return (_feature: GeoJSON.Feature, latlng: L.LatLng) => {
      return L.circleMarker(latlng, {
        radius: 7,
        fillColor: (style.color as string) || "#3B82F6",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      });
    };
  }, [style.color]);

  if (!geoData) return null;

  // Use a key that changes when the data source changes to force re-render
  const key = url || JSON.stringify(rawData).slice(0, 100);
  return (
    <GeoJSON
      key={key}
      data={geoData}
      style={() => style}
      pointToLayer={pointToLayer}
    />
  );
}
