import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * Jumlah "putaran" hashing bcrypt yang dilakukan. Disamakan dengan routes/auth.ts.
 */
const SALT_ROUNDS = 10;

/**
 * Semua endpoint di file ini wajib login sebagai investor.
 */
router.use(requireAuth);

/**
 * GET /profile
 * Mengembalikan data akun investor yang sedang login (tanpa password).
 */
router.get("/", async (req, res) => {
  const investorId = req.investor!.investorId;

  try {
    const investor = await prisma.investor.findUnique({
      where: { investor_id: investorId },
      select: { investor_id: true, name: true, email: true, created_at: true },
    });

    if (!investor) {
      return res.status(404).json({ success: false, message: "Investor tidak ditemukan" });
    }

    res.json({ success: true, data: investor });
  } catch (error) {
    console.error("Gagal mengambil profil investor:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil profil" });
  }
});

/**
 * PATCH /profile
 * Memperbarui nama dan/atau email investor yang sedang login.
 * Body: { name?, email? }
 */
router.patch("/", async (req, res) => {
  const investorId = req.investor!.investorId;
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({
      success: false,
      message: "Tidak ada data yang diubah",
    });
  }

  try {
    /**
     * Kalau email diubah, pastikan email baru belum dipakai investor lain.
     */
    if (email) {
      const existing = await prisma.investor.findUnique({ where: { email } });
      if (existing && existing.investor_id !== investorId) {
        return res.status(409).json({ success: false, message: "Email sudah digunakan" });
      }
    }

    const investor = await prisma.investor.update({
      where: { investor_id: investorId },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      },
      select: { investor_id: true, name: true, email: true, created_at: true },
    });

    res.json({ success: true, message: "Profil berhasil diperbarui", data: investor });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Email sudah digunakan" });
    }

    console.error("Gagal memperbarui profil investor:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui profil" });
  }
});

/**
 * PATCH /profile/password
 * Mengganti password investor yang sedang login.
 * Body: { current_password, new_password }
 */
router.patch("/password", async (req, res) => {
  const investorId = req.investor!.investorId;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: "Kata sandi saat ini dan kata sandi baru wajib diisi",
    });
  }

  if (new_password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Kata sandi baru minimal 8 karakter",
    });
  }

  try {
    const investor = await prisma.investor.findUnique({ where: { investor_id: investorId } });
    if (!investor) {
      return res.status(404).json({ success: false, message: "Investor tidak ditemukan" });
    }

    const isPasswordValid = await bcrypt.compare(current_password, investor.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Kata sandi saat ini tidak sesuai",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS);

    await prisma.investor.update({
      where: { investor_id: investorId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: "Kata sandi berhasil diperbarui" });
  } catch (error) {
    console.error("Gagal memperbarui kata sandi:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui kata sandi" });
  }
});

export default router;
