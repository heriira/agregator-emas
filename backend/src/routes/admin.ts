import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/auth";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum diset di environment variables (.env)");
}

const JWT_EXPIRES_IN = "7d";

/**
 * POST /admin/login
 * Login ke dashboard admin.
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
    const admin = await prisma.admin.findUnique({ where: { email } });

    /**
     * Pesan error disamakan untuk email tidak ditemukan maupun password salah.
     */
    if (!admin) {
      return res.status(401).json({ success: false, message: "Email atau kata sandi salah" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Email atau kata sandi salah" });
    }

    /**
     * Payload token untuk login sebagai admin
     */
    const token = jwt.sign(
      { adminId: admin.admin_id, email: admin.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        admin: { admin_id: admin.admin_id, name: admin.name, email: admin.email },
      },
    });
  } catch (error) {
    console.error("Gagal login admin:", error);
    res.status(500).json({ success: false, message: "Login gagal" });
  }
});

/**
 * Semua endpoint DI BAWAH baris ini wajib login sebagai admin. Endpoint di atas (login) sengaja dipasang SEBELUM baris ini supaya tetap bisa diakses.
 */
router.use(requireAdminAuth);

/**
 * GET /admin/providers
 * Diguunakan untuk mengambil semua data provider atau brand emas yang ada pada sistem agregator emas
 */
router.get("/providers", async (_req, res) => {
  try {
    const providers = await prisma.goldProvider.findMany({
      orderBy: { provider_id: "asc" },
    });

    const data = providers.map((provider) => ({
      providerId: provider.provider_id,
      source: provider.source,
      displayName: provider.display_name,
      type: provider.type,
      status: provider.status,
      logo: provider.logo,
      urlHomepage: provider.url_homepage,
      updatedAt: provider.updated_at,
      lastFetchedAt: provider.last_checked_at,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Gagal mengambil daftar provider:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil daftar provider" });
  }
});

/**
 * PATCH /admin/providers/:id/visibility
 * Mengubah visibilitas satu provider (tampilkan/sembunyikan dari halaman publik).
 * Body: { status: "visible" | "hidden" }
 */
router.patch("/providers/:id/visibility", async (req, res) => {
  const providerId = Number(req.params.id);
  const { status } = req.body;

  const adminId = req.admin!.adminId;

  if (Number.isNaN(providerId)) {
    return res.status(400).json({ success: false, message: "ID provider tidak valid" });
  }

  if (status !== "visible" && status !== "hidden") {
    return res.status(400).json({
      success: false,
      message: "status harus salah satu dari: visible, hidden",
    });
  }

  try {
    const provider = await prisma.goldProvider.update({
      where: { provider_id: providerId },
      data: {
        status,
        /**
         * Mencatat admin yang melakukan perubahan terhadap row data
         */
        updated_by: adminId,
      },
    });

    res.json({
      success: true,
      message: "Visibilitas provider berhasil diperbarui",
      data: provider,
    });
  } catch (error: any) {
    /** 
     * P2025 = Prisma tidak menemukan baris yang akan di-update (id tidak ada)
     */
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Provider tidak ditemukan" });
    }

    console.error("Gagal mengubah visibilitas provider:", error);
    res.status(500).json({ success: false, message: "Gagal mengubah visibilitas provider" });
  }
});

/**
 * GET /admin/investors
 * Daftar seluruh investor yang terdaftar di sistem.
 */
router.get("/investors", async (_req, res) => {
  try {
    const investors = await prisma.investor.findMany({
      orderBy: { created_at: "desc" },
      select: {
        investor_id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    res.json({ success: true, data: investors });
  } catch (error) {
    console.error("Gagal mengambil daftar investor:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil daftar investor" });
  }
});

/**
 * GET /admin/notifications
 * Log seluruh email notifikasi yang pernah dicoba dikirim sistem, baik yang berhasil maupun gagal
 */
router.get("/notifications", async (_req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sent_at: "desc" },
      include: {
        investor: { select: { name: true, email: true } },
        alert: { include: { provider: true } },
      },
    });

    const data = notifications.map((notification) => ({
      notificationId: notification.notification_id,
      investor: notification.investor,
      provider: notification.alert.provider.display_name,
      priceType: notification.alert.price_type,
      targetPrice: Number(notification.alert.target_price),
      status: notification.status,
      sentAt: notification.sent_at,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Gagal mengambil log notifikasi:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil log notifikasi" });
  }
});

export default router;
