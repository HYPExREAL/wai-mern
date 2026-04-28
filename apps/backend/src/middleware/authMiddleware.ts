import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token otorisasi tidak ditemukan." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Format token tidak valid." });
    }
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET belum disetting di environment variable.");
      return res.status(500).json({ message: "Konfigurasi server salah." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token tidak valid atau kadaluarsa." });
  }
};
