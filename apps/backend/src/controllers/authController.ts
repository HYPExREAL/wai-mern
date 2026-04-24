import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password diperlukan." });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPasswordHash || !jwtSecret) {
      console.error("Environment variables untuk admin belum disetting.");
      return res.status(500).json({ message: "Konfigurasi server salah." });
    }

    if (email !== adminEmail) {
      return res.status(401).json({ message: "Kredensial tidak valid." });
    }

    const isMatch = await bcrypt.compare(password, adminPasswordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Kredensial tidak valid." });
    }

    const token = jwt.sign({ id: "admin", role: "admin" }, jwtSecret, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login berhasil",
      token,
      user: {
        email: adminEmail,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Error pada loginAdmin:", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};
