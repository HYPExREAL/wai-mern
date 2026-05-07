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

  // Track the best accuracy we've seen so far
  const bestAccuracy = useRef<number>(Infinity);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Only update state if this reading is more accurate than (or equal to)
        // the best we've seen, OR if we haven't gotten a reading yet.
        if (accuracy <= bestAccuracy.current || bestAccuracy.current === Infinity) {
          bestAccuracy.current = accuracy;
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
        maximumAge: 0,   // Never use cached positions — always request a fresh GPS fix
        timeout: 30000,  // Allow up to 30s for the GPS to lock (important on cold starts)
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
