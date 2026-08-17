"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatRupiah } from "@/lib/format";
import { getPriceHistory } from "@/lib/api";
import type { PriceHistoryPoint } from "@/lib/api";
import { GoogleDocs } from "iconoir-react";

const chartConfig = {
  sellPrice: { label: "Harga Beli", color: "var(--gold)" },
  buybackPrice: { label: "Harga Jual", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

function formatTanggalWIB(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    /**
     * Mendefinisikan time zone agar lebih sesuai dan tidak mengikuti zona waktu server.
     */
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

interface PriceHistoryDialogProps {
  source: string;
  displayName: string;
}

/**
 * Popup "Riwayat" per penyedia menampilkan grafik harga beli & jual, maksimal 30 hari terakhir sesuai batas retensi data (related backend/services/scraper.ts).
 * Data riwayat baru di fetch ketika tombol history di klik.
 */
export function PriceHistoryDialog({ source, displayName }: PriceHistoryDialogProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function handleOpenChange(open: boolean) {
    if (!open || history !== null) return;

    try {
      const data = await getPriceHistory(source);
      setHistory(data.history);
      setError(null);
    } catch {
      setError("Gagal mengambil riwayat harga.");
    }
  }

  const chartData = (history ?? []).map((point) => ({
    date: point.recordedDate,
    sellPrice: point.sellPrice,
    buybackPrice: point.buybackPrice,
  }));

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:border-gold/50">
        <GoogleDocs width={16} height={16}/> Riwayat
      </DialogTrigger>
      <DialogContent className="max-w-[90%] sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          <p className="text-[11px] text-muted-foreground">Riwayat harga 30 hari terakhir</p>
        </DialogHeader>

        <div className="flex items-start gap-1.5 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          <GoogleDocs width={16} height={16} className="mt-px shrink-0" />
          <span>
            Riwayat harga tersedia sejak sistem pertama kali dijalankan, maksimal
            30 hari terakhir.
          </span>
        </div>

        {error && <p className="py-10 text-center text-[13px] text-red-600">{error}</p>}

        {!error && history === null && (
          <p className="py-10 text-center text-[13px] text-muted-foreground">Memuat riwayat...</p>
        )}

        {!error && history !== null && chartData.length < 2 && (
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            Riwayat akan muncul setelah beberapa kali pembaruan harga.
          </p>
        )}

        {!error && chartData.length >= 2 && (
          <>
            <div className="h-[280px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatTanggalWIB}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatRupiah(Number(value))}
                      width={78}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(label) => formatTanggalWIB(String(label))}
                          formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-3">
                              <span className="text-muted-foreground">
                                {name === "sellPrice" ? "Harga Beli" : "Harga Jual"}
                              </span>
                              <span className="font-mono font-medium text-foreground tabular-nums">
                                {value === null ? "Tidak tersedia" : formatRupiah(Number(value))}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Line
                      dataKey="sellPrice"
                      type="monotone"
                      stroke="var(--gold)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey="buybackPrice"
                      type="monotone"
                      stroke="var(--muted-foreground)"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={false}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <p className="text-right text-[10px] text-muted-foreground">
              Harga dalam Rp/gram · Data bersumber dari layanan agregasi publik
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
