import { useState, useEffect, useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import { makeSvgIcon } from "./icons";

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

  const iconColor = style?.color || "#3B82F6";

  const pointToLayer = useMemo(() => {
    const icon = makeSvgIcon(iconColor);
    return (_feature: GeoJSON.Feature, latlng: L.LatLng) => {
      return L.marker(latlng, { icon });
    };
  }, [iconColor]);

  if (!geoData) return null;

  const geoDataString = JSON.stringify(geoData);
  const key = `${url || "rawData"}-${geoDataString.length}-${iconColor}-${geoDataString.slice(0, 100)}`;

  return (
    <GeoJSON
      key={key}
      data={geoData}
      style={() => style}
      pointToLayer={pointToLayer}
    />
  );
}
