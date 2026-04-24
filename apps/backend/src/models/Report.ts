import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  title: string;
  description: string;
  severity: "low" | "moderate" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  gps_accuracy: number;
  reporterName: string;
  reporterContact?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (v: number[] | undefined) {
            if (!v || v.length !== 2) return false;
            const lng = v[0];
            const lat = v[1];
            if (lng === undefined || lat === undefined) return false;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: "Koordinat tidak valid. Harus berupa [longitude, latitude].",
        },
      },
    },
    gps_accuracy: { type: Number, required: true },
    reporterName: { type: String, required: true },
    reporterContact: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

// Create a 2dsphere index for geospatial queries
ReportSchema.index({ location: "2dsphere" });

export default mongoose.model<IReport>("Report", ReportSchema);
