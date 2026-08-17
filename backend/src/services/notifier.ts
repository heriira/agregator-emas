import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { sendMail } from "./mailer";

type AlertWithRelations = Prisma.PriceAlertGetPayload<{
  include: { provider: true; investor: true };
}>;

/**
 * Cek semua PriceAlert berstatus "aktif", membandingkan harga TERBARU providernya dengan target masing-masing investor, lalu mengirim email dan mencatat Notification untuk target yang sudah tercapai.
 * Dipanggil setiap kali scraper selesai menyimpan harga terbaru. Setiap kali data harga baru masuk, sistem akan cek semua PriceAlert dengan status aktif".
 */
export async function checkPriceAlerts(): Promise<void> {
  const activeAlerts = await prisma.priceAlert.findMany({
    where: { status: "aktif" },
    include: { provider: true, investor: true },
  });

  for (const alert of activeAlerts) {
    try {
      await processAlert(alert);
    } catch (error) {
      console.error(`Gagal memproses target notifikasi #${alert.alert_id}:`, error);
    }
  }
}

async function processAlert(alert: AlertWithRelations): Promise<void> {

  /* Ambil harga terbaru untuk provider yang dipantau alert ini */
  const latestPrice = await prisma.goldPrice.findFirst({
    where: { provider_id: alert.provider_id },
    orderBy: { fetched_at: "desc" },
  });

  /* Jika belum ada data harga sama sekali untuk provider ini */
  if (!latestPrice) return;
  if (alert.price_type === "jual" && latestPrice.buyback_price === null) return;

  const targetPrice = Number(alert.target_price);
  const currentPrice = alert.price_type === "beli" ? Number(latestPrice.sell_price) : Number(latestPrice.buyback_price);

  /* 
  * "gte" = investor menunggu harga NAIK menyentuh/melewati target.
  * "lte" = investor menunggu harga TURUN menyentuh/melewati target. 
  */
  const isTargetReached = alert.condition === "gte" ? currentPrice >= targetPrice : currentPrice <= targetPrice;

  if (!isTargetReached) return;

  let notificationStatus: "sent" | "failed" = "sent";
  try {
    await sendMail({
      to: alert.investor.email,
      subject: `Target harga ${alert.provider.display_name} tercapai`,
      text: buildAlertEmailText(alert, targetPrice, currentPrice),
    });
  } catch (error) {
    console.error(`Gagal mengirim email untuk alert #${alert.alert_id}:`, error);
    notificationStatus = "failed";
  }

  /* Insert Notification dan update status PriceAlert jadi "selesai" dijalankan */
  await prisma.$transaction([
    prisma.notification.create({
      data: {
        investor_id: alert.investor_id,
        alert_id: alert.alert_id,
        status: notificationStatus,
      },
    }),
    prisma.priceAlert.update({
      where: { alert_id: alert.alert_id },
      data: { status: "selesai" },
    }),
  ]);
}

/* Menyusun isi informasi yang ada di email notifikasi */
function buildAlertEmailText(
  alert: AlertWithRelations,
  targetPrice: number,
  currentPrice: number
): string {
  const jenisLabel = alert.price_type === "beli" ? "Harga beli" : "Harga jual";
  const formatRupiah = (value: number) => `Rp${value.toLocaleString("id-ID")}`;

  return [
    `Halo ${alert.investor.name},`,
    "",
    `${jenisLabel} emas dari ${alert.provider.display_name} sudah mencapai target yang kamu tentukan.`,
    "",
    `Target: ${formatRupiah(targetPrice)}/gram`,
    `Harga saat ini: ${formatRupiah(currentPrice)}/gram`,
    "",
    "Buka Agregator Emas untuk melihat detail lebih lanjut.",
  ].join("\n");
}
