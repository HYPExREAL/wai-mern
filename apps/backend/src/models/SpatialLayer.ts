import mongoose, { type Document } from "mongoose";

export interface ISpatialLayer extends Document {
  name: string;
  description: string;
  fileName: string;
  geoData: object; // GeoJSON FeatureCollection or similar
  style: {
    color: string;
    weight: number;
    opacity: number;
    fillOpacity: number;
    dashArray?: string;
  };
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const spatialLayerSchema = new mongoose.Schema<ISpatialLayer>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    fileName: { type: String, required: true },
    geoData: { type: Object, required: true },
    style: {
      color: { type: String, default: "#3B82F6" },
      weight: { type: Number, default: 2 },
      opacity: { type: Number, default: 0.8 },
      fillOpacity: { type: Number, default: 0.1 },
      dashArray: { type: String, default: "" },
    },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISpatialLayer>("SpatialLayer", spatialLayerSchema);
