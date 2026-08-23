import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProviderLogo } from "@/components/ProviderLogo";
import { formatRupiah, formatGram } from "@/lib/format";
import type { GoldPriceItem } from "@/lib/api";
import { Clock } from "iconoir-react";

interface KalkulatorResultCardProps {
  item: GoldPriceItem;
  mode: "beli" | "jual";
  isGramInput: boolean;
  gram: number;
  rupiah: number;
  rank: "best" | "worst" | null;
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


function formatLastChecked(iso: string | null) {
  return iso ? formatJamWIB(iso) : "Data belum tersedia";
}

export function KalkulatorResultCard({
  item,
  mode,
  isGramInput,
  gram,
  rupiah,
  rank,
}: KalkulatorResultCardProps) {
  const isBeli = mode === "beli";

  const estimasiLabel = isBeli
    ? isGramInput
      ? "Estimasi harga beli"
      : "Estimasi emas didapat"
    : isGramInput
      ? "Estimasi uang diterima"
      : "Estimasi emas dijual";
  const estimasiValue = isGramInput ? formatRupiah(rupiah) : formatGram(gram);
  const hargaAktif = isBeli ? item.sellPrice : item.buybackPrice;
  const spread = item.buybackPrice !== null ? item.sellPrice - item.buybackPrice : null;
  const spreadPercent =
    spread !== null && item.sellPrice > 0 ? (spread / item.sellPrice) * 100 : null;

  return (
    <Card
      className={"mb-2.5 gap-3 p-4"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ProviderLogo
            logo={item.logo}
            displayName={item.displayName}
            className="size-[38px] rounded-[10px]"
          />
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground">{item.displayName}</p>
              {rank === "best" && (
                <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
                  {isBeli ? "Termurah" : "Terbaik"}
                </Badge>
              )}
              {rank === "worst" && (
                <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
                  {isBeli ? "Termahal" : "Terendah"}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {hargaAktif !== null ? `${formatRupiah(hargaAktif)}/gram` : "Harga jual tidak tersedia"}
            </p>
          </div>
        </div>

        <div
          className={
            "shrink-0 rounded-[10px] border px-3 py-2 text-right " +
            (rank === "best" ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50")
          }
        >
          <p className="mb-0.5 text-[10px] whitespace-nowrap text-gray-800">{estimasiLabel}</p>
          <p
            className={
              "text-[15px] font-bold whitespace-nowrap " +
              (rank === "best" ? "text-green-700" : "text-gray-700")
            }
          >
            {estimasiValue}
          </p>
        </div>
      </div>

      <div className="my-3 grid grid-cols-2 gap-2 md:grid-cols-3">
        <div className="rounded-[10px] bg-muted p-2.5">
          <p className="mb-1 text-[10px] text-muted-foreground">Harga Beli/gram</p>
          <p className="text-[13px] font-semibold text-gray-700">
            {formatRupiah(item.sellPrice)}
          </p>
        </div>
        <div className="rounded-[10px] bg-muted p-2.5">
          <p className="mb-1 text-[10px] text-muted-foreground">Harga Jual/gram</p>
          <p className="text-[13px] font-semibold text-gray-700">
            {item.buybackPrice !== null ? formatRupiah(item.buybackPrice) : "Tidak tersedia"}
          </p>
        </div>
        <div className="col-span-2 rounded-[10px] bg-muted p-2.5 md:col-span-1">
          <p className="mb-1 text-[10px] text-muted-foreground">Selisih beli-jual</p>
          {spread !== null && spreadPercent !== null ? (
            <>
              <p className="inline text-[13px] font-semibold text-gray-700">{formatRupiah(spread)}</p>
              <p className="inline ml-2 mt-0.5 text-[10px] text-muted-foreground">
                ({spreadPercent.toFixed(2)}%)
              </p>
            </>
          ) : (
            <p className="text-[13px] font-semibold text-gray-700">Tidak tersedia</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock width={14} height={14} />
          {formatLastChecked(item.lastCheckedAt)}
        </p>
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
    </Card>
  );
}
