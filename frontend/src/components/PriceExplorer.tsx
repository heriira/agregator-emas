"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GoldCard } from "@/components/GoldCard";
import { cn } from "@/lib/utils";
import type { GoldPriceItem } from "@/lib/api";
import { Commodity, SmartphoneDevice } from "iconoir-react";

type GoldType = "fisik" | "digital";
type SortMode = "default" | "sell_asc" | "sell_desc" | "spread_asc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "sell_asc", label: "Harga Beli ↑" },
  { value: "sell_desc", label: "Harga Beli ↓" },
  { value: "spread_asc", label: "Selisih ↑" },
];

function sortItems(items: GoldPriceItem[], mode: SortMode): GoldPriceItem[] {
  const sorted = [...items];

  switch (mode) {
    case "sell_asc":
      return sorted.sort((a, b) => a.sellPrice - b.sellPrice);
    case "sell_desc":
      return sorted.sort((a, b) => b.sellPrice - a.sellPrice);
    case "spread_asc": {
      const spreadOf = (item: GoldPriceItem) =>
        item.buybackPrice !== null ? item.sellPrice - item.buybackPrice : null;
      return sorted.sort((a, b) => {
        const spreadA = spreadOf(a);
        const spreadB = spreadOf(b);
        if (spreadA === null && spreadB === null) return 0;
        if (spreadA === null) return 1;
        if (spreadB === null) return -1;
        return spreadA - spreadB;
      });
    }
    default:
      return sorted;
  }
}

function formatWaktu(iso: string) {
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso)) + " WIB"
  );
}

interface PriceExplorerProps {
  items: GoldPriceItem[];
}

export function PriceExplorer({ items }: PriceExplorerProps) {
  const [tab, setTab] = useState<GoldType>("fisik");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const itemsForTab = useMemo(
    () => items.filter((item) => item.type === tab),
    [items, tab]
  );

  const sortedItems = useMemo(
    () => sortItems(itemsForTab, sortMode),
    [itemsForTab, sortMode]
  );

  /**
   * Penanda "Harga Terendah"/"Harga Tertinggi" dihitung dari harga beli (sellPrice) di antara penyedia yang SEDANG tampil di tab yang aktif.
   */
  const { lowestSource, highestSource } = useMemo(() => {
    if (itemsForTab.length === 0) return { lowestSource: null, highestSource: null };
    let lowest = itemsForTab[0]!;
    let highest = itemsForTab[0]!;
    for (const item of itemsForTab) {
      if (item.sellPrice < lowest.sellPrice) lowest = item;
      if (item.sellPrice > highest.sellPrice) highest = item;
    }

    /**
     * Kalau semua harga sama (mis. cuma ada 1 penyedia), tidak ada yang "terendah" atau "tertinggi" sehingga tidak perlu ditandai.
     */
    if (lowest.source === highest.source) return { lowestSource: null, highestSource: null };
    return { lowestSource: lowest.source, highestSource: highest.source };
  }, [itemsForTab]);

  
  const maxSpreadPercent = useMemo(() => {
    const spreadPercentages = itemsForTab
      .filter((item) => item.buybackPrice !== null && item.sellPrice > 0)
      .map((item) => ((item.sellPrice - item.buybackPrice!) / item.sellPrice) * 100)
      .filter((percent) => percent > 0);
    return spreadPercentages.length > 0 ? Math.max(...spreadPercentages) : 0;
  }, [itemsForTab]);

  const lastUpdated = useMemo(() => {
    const checkedTimestamps = itemsForTab
      .map((item) => item.lastCheckedAt)
      .filter((value): value is string => value !== null);
    if (checkedTimestamps.length === 0) return null;
    return checkedTimestamps.reduce((latest, current) => (current > latest ? current : latest));
  }, [itemsForTab]);

  return (
    <div>
      <div className="mt-3 mb-5 flex flex-col gap-5 md:mt-0 md:mb-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as GoldType)}>
          <TabsList className="w-full border border-border bg-white md:w-fit">
            <TabsTrigger
              value="fisik"
              className="data-active:!bg-foreground data-active:!text-primary-foreground"
            >
              <Commodity /> Emas Fisik
            </TabsTrigger>
            <TabsTrigger
              value="digital"
              className="data-active:!bg-foreground data-active:!text-primary-foreground"
            >
              <SmartphoneDevice /> Emas Digital
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:overflow-visible md:pb-0">
          <span className="hidden sm:inline shrink-0 text-[11px] text-muted-foreground">Urutkan:</span>
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={sortMode === option.value ? "default" : "outline"}
              className="shrink-0"
              onClick={() => setSortMode(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:gap-2.5">
        <span className="text-[12px] font-medium text-muted-foreground">
          {itemsForTab.length} penyedia ditampilkan
        </span>
        {lastUpdated && (
          <>
            <span className="hidden size-[3px] rounded-full bg-gray-300 md:block" />
            <span className="text-[12px] text-muted-foreground">
              Terakhir diperbarui:{" "}
              <strong className="font-semibold text-gray-700">
                {formatWaktu(lastUpdated)}
              </strong>
            </span>
          </>
        )}
      </div>

      {sortedItems.length === 0 ? (
        <div
          className={cn(
            "rounded-2xl border border-dashed border-border bg-card py-16 text-center"
          )}
        >
          <p className="text-sm font-medium text-foreground">
            Belum ada data emas {tab === "fisik" ? "fisik" : "digital"} saat ini
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Data akan muncul begitu sistem berhasil mengambil harga dari penyedia di kategori ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {sortedItems.map((item) => (
            <GoldCard
              key={item.source}
              item={item}
              maxSpreadPercent={maxSpreadPercent}
              highlight={
                item.source === lowestSource
                  ? "lowest"
                  : item.source === highestSource
                    ? "highest"
                    : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
