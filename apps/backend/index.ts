import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./src/routes/authRoutes";
import reportRoutes from "./src/routes/reportRoutes";
import layerRoutes from "./src/routes/layerRoutes";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/layers", layerRoutes);

// Basic health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Connect to MongoDB (cached for serverless — avoids reconnecting on every invocation)
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/wai-flood";

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
  console.log("✅ Connected to MongoDB");
}

// ── Local dev: start the server with app.listen ────────────────
// In Vercel serverless, this block is skipped because there's no persistent process
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`🚀 Backend server is running on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
      process.exit(1);
    });
}

// ── Vercel serverless export ───────────────────────────────────
// Wraps every request with a DB connection check before handling
import type { IncomingMessage, ServerResponse } from "http";
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await connectDB();
  return app(req, res);
}