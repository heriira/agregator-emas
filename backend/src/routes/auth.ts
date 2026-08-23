import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { sendMail } from "../services/mailer";

const router = Router();

/**
 * URL frontend, dipakai untuk menyusun link reset password yang dikirim via email.
 */
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL belum diset di environment variables (.env)");
}

/**
 * Durasi token reset password berlaku (dalam milidetik).
 */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

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
     * Akun yang dinonaktifkan admin tidak boleh bisa login.
     */
    if (investor.status === "nonaktif") {
      return res.status(403).json({
        success: false,
        message: "Akun Anda tidak dapat digunakan. Silakan hubungi administrator.",
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

/**
 * POST /auth/forgot-password
 * Mengirimkan link reset password ke email investor jika email tersebut terdaftar.
 * Body: { email }
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email wajib diisi" });
  }

  /**
   * Pesan sukses ini SELALU dikirim, baik email terdaftar maupun tidak supaya tidak bisa menebak-nebak email mana saja yang terdaftar di sistem
   * (sama seperti alasan pesan error disamakan di /auth/login).
   */
  const genericSuccess = {
    success: true,
    message: "Jika email terdaftar, link reset password telah dikirimkan. Silakan cek email Anda.",
  };

  try {
    const investor = await prisma.investor.findUnique({ where: { email } });

    if (!investor) {
      return res.json(genericSuccess);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: {
        investor_id: investor.investor_id,
        token,
        expires_at: expiresAt,
      },
    });

    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    try {
      await sendMail({
        to: investor.email,
        subject: "Reset Kata Sandi - Agregator Emas",
        text: `Halo ${investor.name},\n\nKami menerima permintaan untuk mereset kata sandi akun Agregator Emas Anda. Klik link berikut untuk membuat kata sandi baru (berlaku 1 jam):\n\n${resetLink}\n\nJika Anda tidak meminta ini, abaikan saja email ini.`,
      });
    } catch (mailError) {
      /**
       * Kegagalan pengiriman email tidak boleh membocorkan status pendaftaran email ke user, jadi tetap balas dengan pesan generik sukses. Errornya dicatat di server untuk keperluan debug.
       */
      console.error("Gagal mengirim email reset password:", mailError);
    }

    res.json(genericSuccess);
  } catch (error) {
    console.error("Gagal memproses lupa password:", error);
    res.status(500).json({ success: false, message: "Gagal memproses permintaan" });
  }
});

/**
 * POST /auth/reset-password
 * Mengganti password investor menggunakan token reset yang valid.
 * Body: { token, password }
 */
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: "Token dan kata sandi baru wajib diisi",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Kata sandi minimal 8 karakter",
    });
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (
      !resetToken ||
      resetToken.used ||
      resetToken.expires_at.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Token reset tidak valid atau sudah kedaluwarsa",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    /**
     * Update password dan tandai token sudah dipakai dalam satu transaksi supaya token yang sama tidak bisa dipakai dua kali.
     */
    await prisma.$transaction([
      prisma.investor.update({
        where: { investor_id: resetToken.investor_id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    res.json({ success: true, message: "Kata sandi berhasil diperbarui" });
  } catch (error) {
    console.error("Gagal reset password:", error);
    res.status(500).json({ success: false, message: "Gagal reset password" });
  }
});

export default router;
