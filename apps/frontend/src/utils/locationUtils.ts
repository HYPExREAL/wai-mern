import { isInsideBandarLampung, isInsideIteraArea } from "./geofence";

export const getDistrictFromCoords = (lat: number, lng: number): string => {
  if (!isInsideBandarLampung(lng, lat)) {
    return "Luar Wilayah";
  }

  if (isInsideIteraArea(lng, lat)) {
    return "ITERA / Jati Agung";
  }

  if (lat < -5.44 && lng > 105.28) return "Panjang";
  if (lat < -5.42 && lng > 105.25) return "Teluk Betung";
  if (lat > -5.38 && lng < 105.25) return "Rajabasa";
  if (lat > -5.39 && lng > 105.26) return "Way Halim";
  if (lat > -5.40 && lng > 105.28) return "Sukabumi";
  if (lng < 105.24) return "Kemiling";
  return "Tanjung Karang";
};
