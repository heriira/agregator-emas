import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/auth";

const router = Router();

/**
 * Format tanggal untuk nama file export, mis. "2026-08-23" (zona waktu WIB).
 */
function formatTanggalFile(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTanggalWIB(date: Date): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(date)
  );
}

function formatWaktuWIB(date: Date): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

/**
 * Menyusun satu file Excel dari data tabular lalu mengirimkannya sebagai response download.
 */
function sendExcelFile(
  res: import("express").Response,
  filename: string,
  sheetName: string,
  rows: Record<string, string | number>[]
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

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
        status: true,
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
 * GET /admin/investors/export
 * Mengunduh seluruh data investor dalam bentuk file Excel (.xlsx).
 */
router.get("/investors/export", async (_req, res) => {
  try {
    const investors = await prisma.investor.findMany({
      orderBy: { created_at: "desc" },
      select: {
        investor_id: true,
        name: true,
        email: true,
        status: true,
        created_at: true,
      },
    });

    const rows = investors.map((investor, index) => ({
      No: index + 1,
      Nama: investor.name,
      Email: investor.email,
      Status: investor.status === "aktif" ? "Aktif" : "Nonaktif",
      "Tanggal Daftar": formatTanggalWIB(investor.created_at),
    }));

    sendExcelFile(
      res,
      `daftar-investor-${formatTanggalFile(new Date())}.xlsx`,
      "Investor",
      rows
    );
  } catch (error) {
    console.error("Gagal mengekspor data investor:", error);
    res.status(500).json({ success: false, message: "Gagal mengekspor data investor" });
  }
});

/**
 * PATCH /admin/investors/:id/status
 * Mengaktifkan atau menonaktifkan akun investor. Investor berstatus "nonaktif" ditolak saat login (lihat routes/auth.ts).
 * Body: { status: "aktif" | "nonaktif" }
 */
router.patch("/investors/:id/status", async (req, res) => {
  const investorId = Number(req.params.id);
  const { status } = req.body;

  if (Number.isNaN(investorId)) {
    return res.status(400).json({ success: false, message: "ID investor tidak valid" });
  }

  if (status !== "aktif" && status !== "nonaktif") {
    return res.status(400).json({
      success: false,
      message: "status harus salah satu dari: aktif, nonaktif",
    });
  }

  try {
    const investor = await prisma.investor.update({
      where: { investor_id: investorId },
      data: { status },
      select: {
        investor_id: true,
        name: true,
        email: true,
        status: true,
        created_at: true,
      },
    });

    res.json({
      success: true,
      message: "Status investor berhasil diperbarui",
      data: investor,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Investor tidak ditemukan" });
    }

    console.error("Gagal mengubah status investor:", error);
    res.status(500).json({ success: false, message: "Gagal mengubah status investor" });
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

/**
 * GET /admin/notifications/export
 * Mengunduh seluruh log notifikasi dalam bentuk file Excel (.xlsx).
 */
router.get("/notifications/export", async (_req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sent_at: "desc" },
      include: {
        investor: { select: { name: true, email: true } },
        alert: { include: { provider: true } },
      },
    });

    const rows = notifications.map((notification, index) => ({
      No: index + 1,
      "Nama Pengguna": notification.investor.name,
      Email: notification.investor.email,
      Penyedia: notification.alert.provider.display_name,
      "Harga Target": Number(notification.alert.target_price),
      "Jenis Harga": notification.alert.price_type === "beli" ? "Harga Beli" : "Harga Jual",
      "Waktu Terkirim": formatWaktuWIB(notification.sent_at),
      Status: notification.status === "sent" ? "Terkirim" : "Gagal",
    }));

    sendExcelFile(
      res,
      `log-notifikasi-${formatTanggalFile(new Date())}.xlsx`,
      "Notifikasi",
      rows
    );
  } catch (error) {
    console.error("Gagal mengekspor log notifikasi:", error);
    res.status(500).json({ success: false, message: "Gagal mengekspor log notifikasi" });
  }
});

export default router;
