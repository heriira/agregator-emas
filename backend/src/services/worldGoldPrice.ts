import axios from "axios";
import { prisma } from "../lib/prisma";

const UNIRATE_API_KEY = process.env.UNIRATE_API_KEY;
if (!UNIRATE_API_KEY) {
  throw new Error("UNIRATE_API_KEY belum diset di environment variables (.env)");
}

/* Gold-api.com untuk mengambil harga spot emas dunia (XAU/USD per troy ounce). URL sengaja di-hardcode karena tidak terdapat secret atau data sensitif yang perlu disimpan sebagai environment variable */
const GOLD_SPOT_API_URL = "https://api.gold-api.com/price/XAU";

/* Unirateapi.com digunakan HANYA untuk konversi mata uang dari (USD -> IDR) */
const UNIRATE_CONVERT_URL = "https://api.unirateapi.com/api/convert";

const TROY_OUNCE_IN_GRAMS = 31.1034768;

/* Gold-api.com untuk mengambil harga spot emas dunia (XAU/USD per troy ounce). URL sengaja di-hardcode karena tidak terdapat secret atau data sensitif yang perlu disimpan sebagai environment variableiwayat maksimal 30 hari, data lama boleh dihapus untuk efisiensi. */
const HISTORY_DAYS = 30;

interface GoldSpotResponse {
  price: number;
}

interface ConvertResponse {
  result: number;
}

async function fetchSpotPriceUsd(): Promise<number> {
  const { data } = await axios.get<GoldSpotResponse>(GOLD_SPOT_API_URL);
  return data.price;
}

async function fetchUsdToIdrRate(): Promise<number> {
  const { data } = await axios.get<ConvertResponse>(UNIRATE_CONVERT_URL, {
    params: { api_key: UNIRATE_API_KEY, from: "USD", to: "IDR", amount: 1 },
  });
  return data.result;
}

/**
 * Mengambil harga spot XAU/USD terbaru dan menyimpannya sebagai snapshot baru. Cuma insert baris baru kalau harganya BENAR-BENAR berubah dari snapshot terakhir pola yang sama seperti upsertPriceIfChanged di scraper.ts
 */
export async function refreshWorldGoldPrice(): Promise<void> {
  try {
    const priceUsd = await fetchSpotPriceUsd();

    const lastSnapshot = await prisma.worldGoldPrice.findFirst({
      orderBy: { recorded_at: "desc" },
    });

    const isUnchanged = lastSnapshot !== null && Number(lastSnapshot.price_usd_oz) === priceUsd;
    if (isUnchanged) return;

    await prisma.worldGoldPrice.create({ data: { price_usd_oz: priceUsd } });
  } catch (error) {
    console.error("Gagal mengambil harga emas dunia (XAU/USD):", error);
  }
}

export interface WorldGoldPriceSummary {
  priceUsdPerOz: number;
  changePercent: number | null;
  pricePerGramIdr: number | null;
  history: { recordedAt: Date; priceUsdPerOz: number }[];
}

/** Summary dari harga emas dunia yang sudah di snapshot */
export async function getWorldGoldPriceSummary(): Promise<WorldGoldPriceSummary | null> {
  const history = await prisma.worldGoldPrice.findMany({
    where: {
      recorded_at: { gte: new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000) },
    },
    orderBy: { recorded_at: "asc" },
  });

  if (history.length === 0) return null;

  const latest = history[history.length - 1]!;
  const previous = history.length > 1 ? history[history.length - 2]! : null;

  const priceUsdPerOz = Number(latest.price_usd_oz);
  const changePercent = previous
    ? ((priceUsdPerOz - Number(previous.price_usd_oz)) / Number(previous.price_usd_oz)) * 100
    : null;

  /* Kurs USD->IDR diambil live setiap request */
  let pricePerGramIdr: number | null = null;
  try {
    const usdToIdr = await fetchUsdToIdrRate();
    pricePerGramIdr = (priceUsdPerOz / TROY_OUNCE_IN_GRAMS) * usdToIdr;
  } catch (error) {
    console.error("Gagal mengambil kurs USD->IDR:", error);
  }

  return {
    priceUsdPerOz,
    changePercent,
    pricePerGramIdr,
    history: history.map((h) => ({
      recordedAt: h.recorded_at,
      priceUsdPerOz: Number(h.price_usd_oz),
    })),
  };
}

/*
 * Menghapus snapshot WorldGoldPrice yang lebih tua dari HISTORY_DAYS — dipanggil dari jadwal cron yang sama dengan cleanupOldPrices di scraper.ts
 */
export async function cleanupOldWorldGoldPrices(): Promise<void> {
  const cutoffDate = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.worldGoldPrice.deleteMany({
      where: { recorded_at: { lt: cutoffDate } },
    });

    if (result.count > 0) {
      console.log(
        `Cleanup: ${result.count} baris WorldGoldPrice lebih dari ${HISTORY_DAYS} hari berhasil dihapus.`
      );
    }
  } catch (error) {
    console.error("Gagal membersihkan data harga emas dunia lama:", error);
  }
}