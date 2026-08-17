"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { WorldGoldPrice } from "@/lib/api";
import { ArrowDown, ArrowUp } from "iconoir-react";

const chartConfig = {
  priceUsdPerOz: {
    label: "Harga (USD/oz)",
    color: "var(--gold)",
  },
} satisfies ChartConfig;

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

interface XauUsdTickerProps {
  data: WorldGoldPrice;
}

export function XauUsdTicker({ data }: XauUsdTickerProps) {
  const chartData = data.history.map((point) => ({
    date: point.recordedAt,
    priceUsdPerOz: point.priceUsdPerOz,
  }));

  const isUp = (data.changePercent ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="mb-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Harga Emas Dunia
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-foreground">
              {formatUsd(data.priceUsdPerOz)}
            </span>
            {data.changePercent !== null && (
              <span
                className={
                  "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold " +
                  (isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")
                }
              >
                {isUp ? <ArrowUp width={12} height={12} /> : <ArrowDown width={12} height={12} />}
                {Math.abs(data.changePercent).toFixed(2)}%
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            per troy ounce · XAU/USD
          </p>
        </div>
      </div>

      <div className="h-[130px]">
        {chartData.length > 1 ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="xauFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={["auto", "auto"]} hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatUsd(Number(value))}
                      labelFormatter={(label) =>
                        new Intl.DateTimeFormat("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Jakarta",
                        }).format(new Date(label)) + " WIB"
                      }
                    />
                  }
                />
                <Area
                  dataKey="priceUsdPerOz"
                  type="monotone"
                  stroke="var(--gold)"
                  strokeWidth={1.8}
                  fill="url(#xauFill)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
            Riwayat akan muncul setelah beberapa kali pembaruan harga
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
        <span className="text-[10px] text-muted-foreground">
          Setara per gram (IDR) · 30 hari terakhir
        </span>
        {data.pricePerGramIdr !== null && (
          <span className="text-[13px] font-semibold text-gold">
            {formatRupiah(data.pricePerGramIdr)}
          </span>
        )}
      </div>
    </div>
  );
}
