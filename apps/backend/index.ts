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
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "50mb" }));

// Connect to MongoDB (cached for serverless)
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/wai-flood";

let isConnected = false;
async function connectDB() {
  // 5-second timeout to prevent Vercel 10s serverless timeout crash
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  isConnected = true;
  console.log("✅ Connected to MongoDB");
}

// Ensure DB is connected before handling routes (except health)
app.use(async (req, res, next) => {
  if (req.path === "/api/health") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/layers", layerRoutes);

// Basic health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});


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
export default function handler(req: any, res: any) {
  return app(req, res);
}