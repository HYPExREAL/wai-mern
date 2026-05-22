/** Format depth in cm for display */
export function formatDepth(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(1)} m`;
  return `${cm} cm`;
}

/** Get a severity label and color from depth in cm */
export function getSeverityFromDepth(cm: number): {
  label: string;
  colorClass: string;
} {
  if (cm >= 150) return { label: "Kritis", colorClass: "bg-red-100 text-red-700" };
  if (cm >= 70) return { label: "Tinggi", colorClass: "bg-orange-100 text-orange-700" };
  if (cm >= 30) return { label: "Sedang", colorClass: "bg-amber-100 text-amber-700" };
  return { label: "Rendah", colorClass: "bg-emerald-100 text-emerald-700" };
}
