import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProviderLogo } from "@/components/ProviderLogo";
import { formatRupiah } from "@/lib/format";
import type { PriceAlertItem } from "@/lib/api";

interface AlertCardProps {
  alert: PriceAlertItem;
  currentPrice: number | null;
  onDelete: () => void;
  isDeleting: boolean;
}

export function AlertCard({ alert, currentPrice, onDelete, isDeleting }: AlertCardProps) {
  const isAktif = alert.status === "aktif";

  /**
   * Menghitung seberapa dekat harga saat ini dengan harga target.
   * Nilainya maksimal 100% dan bisa digunakan baik ketika target berada di atas maupun di bawah harga saat ini.
   * Progress = (harga yang lebih kecil ÷ harga yang lebih besar) × 100
   */

  const progressPercent = currentPrice !== null && currentPrice > 0 && alert.targetPrice > 0
      ? Math.min(100, Math.round((Math.min(currentPrice, alert.targetPrice) / Math.max(currentPrice, alert.targetPrice)) * 100))
      : 0;

  const formattedCreatedAt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(alert.createdAt));

  return (
    <div className="mb-2.5 rounded-2xl border border-border bg-card p-4">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ProviderLogo
            logo={alert.provider.logo}
            displayName={alert.provider.displayName}
            className="size-8 rounded-lg"
          />
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[13px] font-semibold text-foreground">
                {alert.provider.displayName}
              </p>
              <Badge variant="outline" className="text-[10px]">
                {alert.priceType === "beli" ? "Harga Beli" : "Harga Jual"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dibuat {formattedCreatedAt}
            </p>
          </div>
        </div>

        <Badge
          className={
            isAktif
              ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
              : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-100"
          }
        >
          {isAktif ? "Aktif" : "Selesai"}
        </Badge>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-[10px] bg-muted p-2.5">
          <p className="text-[10px] text-muted-foreground">Target</p>
          <p className="text-[13px] font-semibold text-foreground">
            {formatRupiah(alert.targetPrice)}
          </p>
        </div>
        <div className="rounded-[10px] bg-muted p-2.5">
          <p className="text-[10px] text-muted-foreground">Harga Saat Ini</p>
          <p className="text-[13px] font-semibold text-foreground">
            {currentPrice !== null ? formatRupiah(currentPrice) : "-"}
          </p>
        </div>
      </div>

      <div className="mb-3 h-[5px] overflow-hidden rounded-full bg-muted">
        <div
          className={"h-full rounded-full " + (isAktif ? "bg-gold" : "bg-green-500")}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Target yang sudah selesai tidak bisa dihapus karena sudah memiliki riwayat notifikasi. Tombol hapus hanya ditampilkan untuk target aktif. */}
      {isAktif && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Menghapus..." : "Hapus Target"}
        </Button>
      )}
    </div>
  );
}
