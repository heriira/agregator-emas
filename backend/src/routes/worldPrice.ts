import { Router } from "express";
import { refreshWorldGoldPrice, getWorldGoldPriceSummary } from "../services/worldGoldPrice";

const router = Router();

/**
 * GET /world-price
 * Indikator harga emas dunia XAU/USD dipicu-tiap-request sama seperti GET /prices, bukan cron job terjadwal.
 */
router.get("/", async (_req, res) => {
  try {
    await refreshWorldGoldPrice();
    const summary = await getWorldGoldPriceSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Gagal mengambil ringkasan harga emas dunia:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil harga emas dunia" });
  }
});

export default router;
