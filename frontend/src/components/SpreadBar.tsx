interface SpreadBarProps {
  sellPrice: number;
  buybackPrice: number;
  maxSpreadPercent: number;
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export function SpreadBar({ sellPrice, buybackPrice, maxSpreadPercent }: SpreadBarProps) {
  const spread = sellPrice - buybackPrice;
  const spreadPercent = sellPrice > 0 ? (spread / sellPrice) * 100 : 0;
  /**
   * maxSpreadPercent bisa 0 kalau tab aktif kosong atau semua spread-nya negatif/nol.
   */
  const barWidthPercent =
    maxSpreadPercent > 0
      ? Math.min(100, Math.max(0, (spreadPercent / maxSpreadPercent) * 100))
      : 0;

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[11px]">
        <span className="text-muted-foreground">Selisih Harga</span>
        <span className="font-semibold text-foreground">
          {formatRupiah(spread)}{" "}
          <span className="font-normal text-muted-foreground">
            ({spreadPercent.toFixed(2)}%)
          </span>
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-gold"
          style={{ width: `${barWidthPercent}%` }}
        />
      </div>
    </div>
  );
}
