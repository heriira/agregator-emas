import axios from "axios";
import { prisma } from "../lib/prisma";

const GOLD_API_URL = process.env.GOLD_API_URL;
const GOLD_API_KEY = process.env.GOLD_API_KEY;

/* Sumber harga emas DIGITAL (Treasury, Pegadaian, Laku Emas) dari logam-mulia-api.iamutaki.workers.dev publik, tanpa API key. */
const DIGITAL_GOLD_API_URL = process.env.DIGITAL_GOLD_API_URL;

interface MaulanarPriceItem {
  brand: string;
  resource: string;
  weight: number;
  sell_price: number;
  buyback_price: number;
  updated_at: string;
}

interface MaulanarResponse {
  status: string;
  data: MaulanarPriceItem[];
}

/* Sumber: emas.maulanar.my.id. Satu brand bisa punya beberapa resource dengan harga berbeda, jadi tiap provider dipetakan ke SATU resource acuan. */
const PROVIDER_SOURCES: Record<string, { brand: string; resource: string }> = {
  antam: { brand: "ANTAM", resource: "antam" },
  galeri24: { brand: "GALERI 24", resource: "galeri24" },
  emasku: { brand: "EMASKU", resource: "hartadinata" },
};

async function fetchLatestPrice(
  brand: string,
  resource: string
): Promise<MaulanarPriceItem | null> {
  const { data } = await axios.get<MaulanarResponse>(`${GOLD_API_URL}/api/prices`, {
    headers: { "X-API-Key": GOLD_API_KEY },
    params: {
      "brand[eq]": brand,
      "resource[eq]": resource,
      "weight[eq]": 1,
      sort_by: "updated_at",
      order: "desc",
      limit: 1,
    },
  });

  return data.data[0] ?? null;
}

/** 
* Digunakan oleh semua provider (fisik & digital). Selalu update last_checked_at, tapi GoldPrice cuma di-insert 
* kalau harganya BERUBAH dari baris terakhir mencegah baris duplikat menumpuk tiap kali ada pengunjung buka halaman 
* harga (refreshGoldPrices dipanggil di SETIAP request GET /prices). 
*/
async function upsertPriceIfChanged(
  providerId: number,
  sellPrice: number,
  buybackPrice: number | null,
  recordedDate: Date
): Promise<void> {
  await prisma.goldProvider.update({
    where: { provider_id: providerId },
    data: { last_checked_at: new Date() },
  });

  const lastPrice = await prisma.goldPrice.findFirst({
    where: { provider_id: providerId },
    orderBy: { fetched_at: "desc" },
  });

  const lastBuyback =
    lastPrice?.buyback_price !== null && lastPrice?.buyback_price !== undefined
      ? Number(lastPrice.buyback_price)
      : null;

  const isUnchanged =
    lastPrice !== null &&
    Number(lastPrice.sell_price) === sellPrice &&
    lastBuyback === buybackPrice;

  if (isUnchanged) return;

  await prisma.goldPrice.create({
    data: {
      provider_id: providerId,
      sell_price: sellPrice,
      buyback_price: buybackPrice,
      recorded_date: recordedDate,
    },
  });
}

async function refreshProviderPrice(source: string, brand: string, resource: string) {
  const provider = await prisma.goldProvider.findUnique({ where: { source } });
  if (!provider) return;

  const latest = await fetchLatestPrice(brand, resource);
  if (!latest) return;

  await upsertPriceIfChanged(
    provider.provider_id,
    latest.sell_price,
    latest.buyback_price,
    new Date(latest.updated_at)
  );
}

export async function refreshGoldPrices(): Promise<void> {
  await Promise.allSettled(
    Object.entries(PROVIDER_SOURCES).map(async ([source, { brand, resource }]) => {
      try {
        await refreshProviderPrice(source, brand, resource);
      } catch (error) {
        console.error(`Gagal mengambil harga untuk provider "${source}":`, error);
      }
    })
  );
}

/* 
* ============================================================================
* PROVIDER DIGITAL (Treasury, Pegadaian, Laku Emas)
* Sumber: logam-mulia-api.iamutaki.workers.dev
* ============================================================================ 
*/

interface DigitalPriceItem {
  source: string;
  materialType: string;
  weight: number;
  sellPrice: number;
  buybackPrice: number;
  recordedDate: string;
}

interface DigitalPriceResponse {
  success: boolean;
  data: DigitalPriceItem[];
}

interface DigitalProviderConfig {
  endpoint: string;
  weight: number;
  materialType?: string;
}

const DIGITAL_PROVIDER_SOURCES: Record<string, DigitalProviderConfig> = {
  treasury: { endpoint: "treasury", weight: 1 },
  pegadaian: { endpoint: "pegadaian", weight: 0.01 },
  lakuemas: { endpoint: "lakuemas", weight: 1 },
};

async function fetchDigitalPrice(
  config: DigitalProviderConfig
): Promise<DigitalPriceItem | null> {
  const { data } = await axios.get<DigitalPriceResponse>(
    `${DIGITAL_GOLD_API_URL}/api/prices/${config.endpoint}`
  );

  /* 
  * API mengembalikan success:false atau data kosong kalau sumbernya lagi bermasalah bukan exception, jadi ditangani sebagai "tidak ada data".
  * Bisa (di-skip), bukan error yang perlu dilempar ke atas. 
  */
  if (!data.success || data.data.length === 0) return null;

  const candidates = data.data.filter((item) => item.weight === config.weight);

  if (config.materialType) {
    return candidates.find((item) => item.materialType === config.materialType) ?? null;
  }

  return candidates[0] ?? null;
}

function normalizeDigitalPrice(
  source: string,
  raw: DigitalPriceItem
): { sellPrice: number; buybackPrice: number | null } {

  /* Pegadaian: harga API per 0.01 gram, dikali 100 biar konsisten dengan provider lain yang per 1 gram. */
  if (source === "pegadaian") {
    return { sellPrice: raw.sellPrice * 100, buybackPrice: raw.buybackPrice * 100 };
  }
  if (source === "lakuemas") {
    return { sellPrice: raw.buybackPrice, buybackPrice: raw.sellPrice };
  }
  return { sellPrice: raw.sellPrice, buybackPrice: raw.buybackPrice };
}

async function refreshDigitalProviderPrice(source: string, config: DigitalProviderConfig) {
  const provider = await prisma.goldProvider.findUnique({ where: { source } });
  if (!provider) return;

  const raw = await fetchDigitalPrice(config);
  if (!raw) return;

  const { sellPrice, buybackPrice } = normalizeDigitalPrice(source, raw);

  await upsertPriceIfChanged(provider.provider_id, sellPrice, buybackPrice, new Date(raw.recordedDate));
}

/*
 * Ambil & simpan harga terbaru provider DIGITAL yang masih dari logam-mulia-api (Treasury, Pegadaian, Laku Emas). Dipanggil bareng refreshGoldPrices() di
 * setiap request GET /prices (routes/prices.ts) bukan lewat cron, sesuai
 */
export async function refreshDigitalGoldPrices(): Promise<void> {
  await Promise.allSettled(
    Object.entries(DIGITAL_PROVIDER_SOURCES).map(async ([source, config]) => {
      try {
        await refreshDigitalProviderPrice(source, config);
      } catch (error) {
        console.error(`Gagal mengambil harga digital untuk provider "${source}":`, error);
      }
    })
  );
}

/*
* ============================================================================
* PROVIDER dari api-emas.up.railway.app (IndoGold, Cermati, UBS, Lotus Archi)
* ============================================================================
*/

const HARGA_EMAS_API_URL = process.env.HARGA_EMAS_API_URL;

interface HargaEmasApiItem {
  source: string;
  materialType: string;
  weight: number;
  sellPrice: number;
  buybackPrice: number;
  recordedDate: string;
}

interface HargaEmasApiResponse {
  success: boolean;
  data: HargaEmasApiItem[];
}

/*
 * Key = source di database (goldProvider.source), value = source di response api-emas.up.railway.app.
 */
const HARGA_EMAS_API_SOURCES: Record<string, string> = {
  indogold: "indogold",
  cermati: "cermati",
  ubs: "ubs",
  "lotus-archi": "lotusarchi",
};

async function fetchHargaEmasApi(): Promise<HargaEmasApiItem[]> {
  const { data } = await axios.get<HargaEmasApiResponse>(`${HARGA_EMAS_API_URL}/api/harga-emas`);
  if (!data.success || data.data.length === 0) return [];
  return data.data;
}

/**
 * Mengambil & menyimpan harga terbaru dari IndoGold, Cermati, UBS, dan Lotus
 * Archi lewat api-emas.up.railway.app. Dipanggil BERSAMAAN dengan
 * refreshGoldPrices() dan refreshDigitalGoldPrices() di setiap request GET /prices
 */
export async function refreshHargaEmasApiPrices(): Promise<void> {
  let items: HargaEmasApiItem[];
  try {
    items = await fetchHargaEmasApi();
  } catch (error) {
    console.error("Gagal mengambil harga dari api-emas.up.railway.app:", error);
    return;
  }

  await Promise.allSettled(
    Object.entries(HARGA_EMAS_API_SOURCES).map(async ([dbSource, apiSource]) => {
      try {
        const item = items.find((i) => i.source === apiSource);
        if (!item) return;

        const provider = await prisma.goldProvider.findUnique({ where: { source: dbSource } });
        if (!provider) return;

        await upsertPriceIfChanged(
          provider.provider_id,
          item.sellPrice,
          item.buybackPrice,
          new Date(item.recordedDate)
        );
      } catch (error) {
        console.error(`Gagal menyimpan harga "${dbSource}" dari api-emas.up.railway.app:`, error);
      }
    })
  );
}

/* Maksimal data yang ditampilkan kepada pengguna adalah 30 hari */
export const RETENTION_DAYS = 30;

/*
 * Menghapus baris GoldPrice yang recorded_date-nya sudah lebih dari RETENTION_DAYS hari yang lalu.
 * Dipanggil secara BERKALA lewat jadwal cron. bukan di setiap request pengguna seperti refreshGoldPrices/checkPriceAlerts.
 */
export async function cleanupOldPrices(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  try {
    const result = await prisma.goldPrice.deleteMany({
      where: { recorded_date: { lt: cutoffDate } },
    });

    if (result.count > 0) {
      console.log(
        `Cleanup: ${result.count} baris GoldPrice lebih dari ${RETENTION_DAYS} hari berhasil dihapus.`
      );
    }
  } catch (error) {
    console.error("Gagal membersihkan data harga lama:", error);
  }
}
