import { useState, useEffect, useRef } from "react";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(() => {
    const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      loading: isSupported,
      error: isSupported ? null : "Geolocation tidak didukung oleh browser Anda.",
    };
  });

  const bestAccuracy = useRef<number>(Infinity);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (accuracy <= 2000 || bestAccuracy.current === Infinity || accuracy < bestAccuracy.current) {
          bestAccuracy.current = Math.min(accuracy, bestAccuracy.current);
          setState({
            latitude,
            longitude,
            accuracy,
            loading: false,
            error: null,
          });
        }
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            err.code === 1
              ? "Izin lokasi ditolak. Aktifkan GPS untuk melaporkan banjir."
              : err.code === 2
                ? "Lokasi tidak tersedia saat ini."
                : "Waktu permintaan lokasi habis.",
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
