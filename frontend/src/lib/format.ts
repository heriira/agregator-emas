// Helper format angka yang dipakai bersama oleh KalkulatorForm & KalkulatorResultCard.

export function formatRupiah(value: number): string {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

/**
 * Emas fisik dijual dalam cetakan sampai 1 kg — di atas itu ditampilkan dalam kg. Contoh 1.000 kg
 */
export function formatGram(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(3)} kg`;
  }
  if (Number.isInteger(value)) {
    return `${value} gram`;
  }
  /**
   * Hasil perhitungan input rupiah ke gram dibulatkan 4 desimal agar value nya tetap presisi dan tidak terlalu panjang.
   */
  return `${value.toFixed(4)} gram`;
}
