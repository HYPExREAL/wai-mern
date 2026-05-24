import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's broken default marker icon paths in Vite/bundled environments
// @ts-expect-error — Leaflet's _getIconUrl is private and not in type defs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
// ── Custom marker icons ────────────────────────────────────────
export function makeSvgIcon(color: string, strokeColor = "#fff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
    <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 28 16 28s16-16 16-28C32 7.164 24.836 0 16 0z" fill="${color}" stroke="${strokeColor}" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
  });
}

export const ICONS: Record<string, L.DivIcon> = {
  pending: makeSvgIcon("#0ea5e9"),   // light blue
  approved: makeSvgIcon("#16A34A"),  // green
  rejected: makeSvgIcon("#DC2626"), // red
  user: makeSvgIcon("#3B82F6"),     // blue — user location
  manual: makeSvgIcon("#A855F7"),   // purple — manual pin
};
