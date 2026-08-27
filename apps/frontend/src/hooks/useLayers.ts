import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../api/apiClient";

export interface LayerMeta {
  _id: string;
  name: string;
  description: string;
  fileName: string;
  style: {
    color: string;
    weight: number;
    opacity: number;
    fillOpacity: number;
    dashArray?: string;
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LayerFull extends LayerMeta {
  geoData: object;
}

export function useLayers(publicOnly = false) {
  const [layers, setLayers] = useState<LayerMeta[]>([]);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
  const [geoDataCache, setGeoDataCache] = useState<Record<string, object>>({});
  const [loading, setLoading] = useState(true);

  const fetchLayers = useCallback(async () => {
    try {
      setLoading(true);
      const url = publicOnly ? "/layers?publicOnly=true" : "/layers";
      const res = await apiClient.get(url);
      setLayers(res.data);
    } catch (err) {
      console.error("Gagal mengambil daftar layer:", err);
    } finally {
      setLoading(false);
    }
  }, [publicOnly]);

  useEffect(() => {
    let cancelled = false;
    const url = publicOnly ? "/layers?publicOnly=true" : "/layers";
    apiClient.get(url)
      .then(res => { if (!cancelled) setLayers(res.data); })
      .catch(err => console.error("Gagal mengambil daftar layer:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [publicOnly]);

  const geoDataCacheRef = useRef(geoDataCache);
  useEffect(() => { geoDataCacheRef.current = geoDataCache; }, [geoDataCache]);

  const toggleLayer = useCallback((id: string) => {
    setEnabledIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!geoDataCacheRef.current[id]) {
          apiClient.get(`/layers/${id}`)
            .then(res => {
              setGeoDataCache(cache => ({ ...cache, [id]: res.data.geoData }));
            })
            .catch(err => console.error("Gagal memuat data layer:", err));
        }
      }
      return next;
    });
  }, []);

  const createLayer = useCallback(async (data: {
    name: string;
    description?: string;
    fileName: string;
    geoData: object;
    style?: LayerMeta["style"];
    isPublic?: boolean;
  }) => {
    const res = await apiClient.post("/layers", data);
    await fetchLayers();
    return res.data;
  }, [fetchLayers]);

  const uploadLayer = useCallback(async (data: {
    file: File;
    name: string;
    color?: string;
    isPublic?: boolean;
  }) => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("name", data.name);
    if (data.color) formData.append("color", data.color);
    if (data.isPublic) formData.append("isPublic", "true");

    const res = await apiClient.post("/layers/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await fetchLayers();
    return res.data;
  }, [fetchLayers]);

  const updateLayer = useCallback(async (id: string, data: Partial<Pick<LayerMeta, "name" | "description" | "style" | "isPublic">>) => {
    const res = await apiClient.patch(`/layers/${id}`, data);
    await fetchLayers();
    return res.data;
  }, [fetchLayers]);

  const deleteLayer = useCallback(async (id: string) => {
    await apiClient.delete(`/layers/${id}`);
    setEnabledIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setGeoDataCache(cache => {
      const next = { ...cache };
      delete next[id];
      return next;
    });
    await fetchLayers();
  }, [fetchLayers]);

  return {
    layers,
    enabledIds,
    geoDataCache,
    loading,
    toggleLayer,
    createLayer,
    uploadLayer,
    updateLayer,
    deleteLayer,
    fetchLayers,
  };
}

