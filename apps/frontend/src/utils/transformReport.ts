import type { FloodReport } from "../context/reportsContextDef";

export interface BackendReport {
  _id: string;
  title: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  severity: number;
  status: FloodReport["status"];
  imageUrl?: string;
  imageUrls?: string[];
  reporterName: string;
  reporterContact?: string;
  markerColor?: string;
  createdAt: string;
}

export const transformReport = (data: BackendReport): FloodReport => ({
  id: data._id,
  title: data.title,
  description: data.description,
  latitude: data.location.coordinates[1],
  longitude: data.location.coordinates[0],
  severity: data.severity,
  status: data.status,
  imageUrl: data.imageUrl,
  imageUrls: data.imageUrls,
  reporterName: data.reporterName,
  reporterContact: data.reporterContact,
  markerColor: data.markerColor,
  createdAt: new Date(data.createdAt),
});
