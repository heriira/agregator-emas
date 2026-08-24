import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { checkPriceAlerts } from "../services/notifier";

const router = Router();

/** 
 * requireAuth digunakan di level router (bukan diulang satu-satu di tiap route) supaya SEMUA endpoint /alerts di bawah ini otomatis wajib login. 
 * Ketika nanti ada route baru ditambahkan di file ini, otomatis ikut terproteksi juga. 
 */
router.use(requireAuth);

const VALID_PRICE_TYPES = ["beli", "jual"] as const;
type PriceType = (typeof VALID_PRICE_TYPES)[number];

type AlertWithProvider = Prisma.PriceAlertGetPayload<{ include: { provider: true } }>;

/** 
 * Mengubah baris hasil query Prisma (sesuai kolom database) menjadi bentuk response API (camelCase) yang konsisten dengan endpoint lain seperti /prices. 
 */
function formatAlert(alert: AlertWithProvider) {
  return {
    alertId: alert.alert_id,
    provider: {
      source: alert.provider.source,
      displayName: alert.provider.display_name,
      type: alert.provider.type,
      logo: alert.provider.logo,
    },
    priceType: alert.price_type,
    targetPrice: Number(alert.target_price),
    condition: alert.condition,
    status: alert.status,
    createdAt: alert.created_at,
  };
}

/**
 * POST /alerts
 * Membuat target notifikasi harga baru untuk investor yang sedang login.
 * Body: { providerSource: string, targetPrice: number, priceType: "beli" | "jual" }
 */
router.post("/", async (req, res) => {
  const { providerSource, targetPrice, priceType } = req.body;

  /** 
   * Validasi bahwa user harus terlebih dahulu login ke sistem
   */
  const investorId = req.investor!.investorId;

  /**
   * Validasi input dilakukan di server, bukan cuma validasi frontend.
   */
  if (!providerSource || targetPrice === undefined || !priceType) {
    return res.status(400).json({
      success: false,
      message: "providerSource, targetPrice, dan priceType wajib diisi",
    });
  }

  if (!VALID_PRICE_TYPES.includes(priceType)) {
    return res.status(400).json({
      success: false,
      message: "priceType harus salah satu dari: beli, jual",
    });
  }

  if (typeof targetPrice !== "number" || targetPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: "targetPrice harus berupa angka lebih dari 0",
    });
  }

  try {
    const provider = await prisma.goldProvider.findUnique({
      where: { source: providerSource },
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Penyedia tidak ditemukan",
      });
    }

    /**
     * Ambil harga TERBARU dari provider yang dipilih sebagai acuan untuk menentukan pengkondisian
     */
    const latestPrice = await prisma.goldPrice.findFirst({
      where: { provider_id: provider.provider_id },
      orderBy: { fetched_at: "desc" },
    });

    if (!latestPrice) {
      return res.status(409).json({
        success: false,
        message: "Data harga penyedia ini belum tersedia, coba lagi nanti",
      });
    }

    if (priceType === "jual" && latestPrice.buyback_price === null) {
      return res.status(409).json({
        success: false,
        message: "Harga jual (buyback) belum tersedia untuk penyedia ini",
      });
    }

    const currentPrice =
      priceType === "beli" ? Number(latestPrice.sell_price) : Number(latestPrice.buyback_price);
    
    /**
     * Target di atas harga berarti investor menunggu harga NAIK ke sana (gte), target di bawah berarti menunggu harga TURUN (lte).
     * Satu-satunya kasus yang tetap langsung "tercapai" adalah kalau target PERSIS SAMA dengan harga saat ini, yang memang secara logika sudah terpenuhi.
     */
    const condition = targetPrice >= currentPrice ? "gte" : "lte";

    const alert = await prisma.priceAlert.create({
      data: {
        investor_id: investorId,
        provider_id: provider.provider_id,
        target_price: targetPrice,
        price_type: priceType as PriceType,
        condition,
        /**
         * Field "status" tidak diisi manual,  nilai default-nya "aktif" sudah diatur di schema.prisma (@default("aktif")).
         */
      },
      include: { provider: true },
    });

    res.status(201).json({
      success: true,
      message: "Target notifikasi berhasil dibuat",
      data: formatAlert(alert),
    });
    /**
     * Time out durasi pemanggilan function checkPriceLerts()
     */
    setTimeout(() => {
      checkPriceAlerts().catch(console.error);
    }, 2000);
  } catch (error) {
    console.error("Gagal membuat target notifikasi:", error);
    res.status(500).json({ success: false, message: "Gagal membuat target notifikasi" });
  }
});

/**
 * GET /alerts
 * Menampilkan daftar target notifikasi milik investor yang sedang login.
 * Query opsional: ?status=aktif|selesai (dipakai untuk tab filter di UI).
 */
router.get("/", async (req, res) => {
  const investorId = req.investor!.investorId;
  const { status } = req.query;

  const statusFilter = status === "aktif" || status === "selesai" ? status : undefined;

  try {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        /** 
         * Validasi ada investor hanya boleh melihat target notifikasi miliknya sendiri.
         */
        investor_id: investorId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: { provider: true },
      orderBy: { created_at: "desc" },
    });

    res.json({ success: true, data: alerts.map(formatAlert) });
  } catch (error) {
    console.error("Gagal mengambil daftar target notifikasi:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil daftar target notifikasi" });
  }
});

/**
 * DELETE /alerts/:id
 * Menghapus satu target notifikasi milik investor yang sedang login.
 */
router.delete("/:id", async (req, res) => {
  const investorId = req.investor!.investorId;
  const alertId = Number(req.params.id);

  if (Number.isNaN(alertId)) {
    return res.status(400).json({ success: false, message: "ID target tidak valid" });
  }

  try {
    const alert = await prisma.priceAlert.findUnique({ where: { alert_id: alertId } });

    /**
     * Cek kepemilikan list notifikasi, jika notifikasi bukan milik user tersebut maka tampilkan pesan target notifikasi tidak ditemukan
     */
    if (!alert || alert.investor_id !== investorId) {
      return res.status(404).json({
        success: false,
        message: "Target notifikasi tidak ditemukan",
      });
    }

    await prisma.priceAlert.delete({ where: { alert_id: alertId } });

    res.json({ success: true, message: "Target notifikasi berhasil dihapus" });
  } catch (error: any) {
    /**
     * Kode P2003 = foreign key constraint gagal. Jika notifikasi sudah pernah dikirim maka target notifikasi tidak bisa akan bisa dihapus.
     */
    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Target ini sudah memiliki riwayat notifikasi dan tidak bisa dihapus",
      });
    }

    console.error("Gagal menghapus target notifikasi:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus target notifikasi" });
  }
});

export default router;