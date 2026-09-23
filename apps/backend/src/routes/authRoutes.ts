import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginAdmin } from "../controllers/authController";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  
  max: 10,                   
  message: { message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", authLimiter, loginAdmin);

export default router;
