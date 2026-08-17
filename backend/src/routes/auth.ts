import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const router = Router();

/** 
 * Jumlah "putaran" hashing bcrypt yang dilakukan. 
 */
const SALT_ROUNDS = 10;

/** 
 * Secret untuk menandatangani JWT. Diambil dari .env 
 */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum diset di environment variables (.env)");
}

/** 
 * Durasi token berlaku sampai user nantinya harus login ulang 
 */
const JWT_EXPIRES_IN = "7d";

/**
 * POST /auth/register
 * Mendaftarkan investor baru.
 * Body: { name, email, password }
 */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

/** 
 * Validasi data yang di input oleh user 
 */
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Nama, email, dan kata sandi wajib diisi",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Kata sandi minimal 8 karakter",
    });
  }

  try {
    /** 
     * Bcrypt.hash membuat hash satu-arah, password asli tidak bisa didapat kembali dari hash ini, hanya bisa diverifikasi kecocokannya (related dengan bcrypt.compare di /login). 
     */
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const investor = await prisma.investor.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      data: {
        investor_id: investor.investor_id,
        name: investor.name,
        email: investor.email,
        created_at: investor.created_at,
      },
    });
  } catch (error: any) {
    /** 
     * Kode P2002 dari Prisma berarti "unique constraint violation" artinya email sudah pernah dipakai untuk mendaftar. 
     */
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    console.error("Gagal registrasi investor:", error);
    res.status(500).json({ success: false, message: "Registrasi gagal" });
  }
});

/**
 * POST /auth/login
 * Login investor menggunakan email & password, mengembalikan JWT jika berhasil.
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email dan kata sandi wajib diisi",
    });
  }

  try {
    const investor = await prisma.investor.findUnique({ where: { email } });

    /** 
     * Pesan error dibuat sama ("email atau kata sandi salah") baik saat email tidak ditemukan maupun saat password salah, untuk mencegah ada serangan menebak-nebak email mana saja yang terdaftar di sistem. 
     */
    if (!investor) {
      return res.status(401).json({
        success: false,
        message: "Email atau kata sandi salah",
      });
    }

    /** 
      * bcrypt.compare digunakan untuk men-hash ulang password yang diinput lalu membandingkannya dengan hash yang tersimpan di database. 
      */
    const isPasswordValid = await bcrypt.compare(password, investor.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email atau kata sandi salah",
      });
    }

    /** 
     * Token berisi identitas investor (payload) yang sudah memiliki JWT_SECRET. 
     * Endpoint lain yang butuh login (mis. kelola target notifikasi) nanti akan memverifikasi token ini lewat middleware, tanpa perlu query DB lagi. 
     */
    const token = jwt.sign(
      { investorId: investor.investor_id, email: investor.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        investor: {
          investor_id: investor.investor_id,
          name: investor.name,
          email: investor.email,
        },
      },
    });
  } catch (error) {
    console.error("Gagal login investor:", error);
    res.status(500).json({ success: false, message: "Login gagal" });
  }
});

export default router;
