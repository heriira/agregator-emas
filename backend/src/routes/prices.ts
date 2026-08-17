import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  refreshGoldPrices,
  refreshDigitalGoldPrices,
  refreshHargaEmasApiPrices,
  RETENTION_DAYS,
} from "../services/scraper";
import { checkPriceAlerts } from "../services/notifier";

function toNullableNumber(value: unknown): number | null {
  return value === null ? null : Number(value);
}

const router = Router();

router.get("/", async (req, res) => {
  const { type, mode, order } = req.query;

  const typeFilter = type === "fisik" || type === "digital" ? type : undefined;
  const priceField = mode === "jual" ? "buybackPrice" : "sellPrice";
  const sortOrder = order === "desc" ? "desc" : "asc";

  try {
  /** 
  * Scrape dan simpan harga terbaru dari semua sumber sekaligus. Semua proses dijalankan bersamaan menggunakan Promise.all, bukan secara berurutan, agar waktu tunggu request tetap efisien. 
  * Setiap sumber selalu mengupdate GoldProvider.last_checked_at, tetapi GoldPrice baru hanya akan di input ke database jika harga benar-benar berubah dari data sebelumnya. 
  */
    await Promise.all([
      refreshGoldPrices(),
      refreshDigitalGoldPrices(),
      refreshHargaEmasApiPrices(),
    ]);

    /** 
    * Setiap kali ada harga baru masuk, langsung cek semua target notifikasi aktif dan kirim email untuk yang sudah tercapai. 
    */
    await checkPriceAlerts();

    const latestPrices = await prisma.goldPrice.findMany({
      where: {
        provider: {
          status: "visible",
          ...(typeFilter ? { type: typeFilter } : {}),
        },
      },
      orderBy: [{ provider_id: "asc" }, { fetched_at: "desc" }],
      distinct: ["provider_id"],
      include: { provider: true },
    });

    const data = latestPrices
      .map((price) => ({
        source: price.provider.source,
        displayName: price.provider.display_name,
        type: price.provider.type,
        logo: price.provider.logo,
        urlHomepage: price.provider.url_homepage,
        sellPrice: Number(price.sell_price),
        buybackPrice: toNullableNumber(price.buyback_price),
        recordedDate: price.recorded_date,
        fetchedAt: price.fetched_at,
        lastCheckedAt: price.provider.last_checked_at,
      }))
      .sort((a, b) => {
        const valueA = a[priceField];
        const valueB = b[priceField];
        if (valueA === null && valueB === null) return 0;
        if (valueA === null) return 1;
        if (valueB === null) return -1;

        return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
      });

    res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Failed to fetch prices:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data harga" });
  }
});

/**
 * GET /prices/:source/history
 * Riwayat harga satu penyedia untuk ditampilkan di popup. Dibatasi RETENTION_DAYS (30 hari, sama seperti batas cleanupOldPrices di services/scraper.ts)
 */
router.get("/:source/history", async (req, res) => {
  const { source } = req.params;

  try {
    const provider = await prisma.goldProvider.findUnique({
      where: { source },
    });

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Penyedia tidak ditemukan" });
    }

    const cutoffDate = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const history = await prisma.goldPrice.findMany({
      where: {
        provider_id: provider.provider_id,
        recorded_date: { gte: cutoffDate },
      },
      orderBy: { recorded_date: "asc" },
    });

    res.json({
      success: true,
      data: {
        source: provider.source,
        displayName: provider.display_name,
        history: history.map((h) => ({
          recordedDate: h.recorded_date,
          sellPrice: Number(h.sell_price),
          buybackPrice: toNullableNumber(h.buyback_price),
        })),
      },
    });
  } catch (error) {
    console.error("Gagal mengambil riwayat harga:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil riwayat harga" });
  }
});

export default router;
