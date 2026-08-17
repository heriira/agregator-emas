import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpreadBar } from "@/components/SpreadBar";
import { PriceHistoryDialog } from "@/components/PriceHistoryDialog";
import { ProviderLogo } from "@/components/ProviderLogo";
import { cn } from "@/lib/utils";
import type { GoldPriceItem } from "@/lib/api";
import { Clock } from "iconoir-react";

function formatRupiahPerGram(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

function formatJamWIB(iso: string) {
  return (
    new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso)) + " WIB"
  );
}

/**
 * Provider yang baru ditambahkan admin dan belum pernah sempat di-scrape punya lastCheckedAt null sehingga ditampilkan pesan tambahan. tanggal dari nilai yang tidak ada.
 */
function formatLastChecked(iso: string | null) {
  return iso ? formatJamWIB(iso) : "Data belum tersedia";
}

interface GoldCardProps {
  item: GoldPriceItem;
  /**
   * Referensi 100% untuk SpreadBar dihitung oleh PriceExplorer dari spread terbesar di antara penyedia yang SEDANG tampil di tab aktif.
   */
  maxSpreadPercent: number;
  highlight?: "lowest" | "highest" | null;
}

export function GoldCard({ item, maxSpreadPercent, highlight }: GoldCardProps) {
  return (
    <Card
      className={cn(
        "gap-3.5 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        // ,highlight ? "ring-2 ring-gold" : "ring-1 ring-border"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <ProviderLogo
            logo={item.logo}
            displayName={item.displayName}
            className="size-[38px] rounded-[10px]"
          />
          <div>
            <p className="text-[13px] font-semibold text-foreground">{item.displayName}</p>
            <p className="text-[11px] text-muted-foreground">
              {item.type === "fisik" ? "Emas Fisik" : "Emas Digital"}
            </p>
          </div>
        </div>

        {highlight === "lowest" && (
          <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
            Harga Terendah
          </Badge>
        )}
        {highlight === "highest" && (
          <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
            Harga Tertinggi
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[10px] bg-muted p-2.5">
          <p className="text-[10px] text-muted-foreground">Harga Beli</p>
          <p className="text-[13px] font-semibold text-foreground">
            Rp{formatRupiahPerGram(item.sellPrice)}
          </p>
          <p className="text-[10px] text-muted-foreground">/gram</p>
        </div>
        <div className="rounded-[10px] bg-muted p-2.5">
          <p className="text-[10px] text-muted-foreground">Harga Jual</p>
          <p className="text-[13px] font-semibold text-foreground">
            {item.buybackPrice !== null ? `Rp${formatRupiahPerGram(item.buybackPrice)}` : "Tidak tersedia"}
          </p>
          <p className="text-[10px] text-muted-foreground">/gram</p>
        </div>
      </div>
      {item.buybackPrice !== null ? (
        <SpreadBar
          sellPrice={item.sellPrice}
          buybackPrice={item.buybackPrice}
          maxSpreadPercent={maxSpreadPercent}
        />
      ) : (
        <p className="rounded-[10px] border border-dashed border-border px-2.5 py-2 text-center text-[11px] text-muted-foreground">
          Selisih harga tidak tersedia, harga jual tidak disediakan penyedia ini.
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock width={14} height={14} />
          {formatLastChecked(item.lastCheckedAt)}
        </p>
        <div className="flex items-center gap-2">
          <PriceHistoryDialog source={item.source} displayName={item.displayName} />
          {item.urlHomepage && (
            <a
              href={item.urlHomepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-gold hover:underline"
            >
              Kunjungi →
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
