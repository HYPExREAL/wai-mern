import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import authRoutes from "./src/routes/authRoutes";
import reportRoutes from "./src/routes/reportRoutes";
import layerRoutes from "./src/routes/layerRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, "http://localhost:5173"] 
    : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

app.use(express.json({ limit: "50mb" }));

app.use(mongoSanitize());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/wai-flood";

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  isConnected = true;
  console.log("✅ Connected to MongoDB");
}

app.use(async (req, res, next) => {
  if (req.method === "OPTIONS" || req.path === "/api/health") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/layers", layerRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.name === "MulterError" || err.message?.includes("Format file")) {
    return res.status(400).json({ message: err.message });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Terjadi kesalahan server." });
});


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

export default app;