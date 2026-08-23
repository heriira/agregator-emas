  import { getPrices } from "@/lib/api";
  import { KalkulatorForm } from "@/components/KalkulatorForm";
  import { WarningCircle } from "iconoir-react";

  /**
   * Data harga di refresh ketika halaman kalkulator dibuka
   */
  export const dynamic = "force-dynamic";

  export default async function KalkulatorPage() {
    let items: Awaited<ReturnType<typeof getPrices>> = [];
    let fetchError: string | null = null;

    try {
      items = await getPrices();
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      fetchError = "Tidak bisa memuat data harga saat ini. Coba muat ulang halaman.";
    }

    return (
      <main className="flex-1">
        {/* HEADER */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 md:py-12">
            <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-foreground">
              Kalkulator Investasi Emas
            </h1>
            <p className="mb-3.5 text-[13px] leading-relaxed text-muted-foreground">
              Masukkan jumlah gram atau nominal rupiah untuk melihat perbandingan dari semua penyedia.
            </p>
            <div className="flex items-start gap-2.5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-2.5">
              <WarningCircle width={24} height={24} className="mt-px shrink-0 text-amber-800" />
              <p className="text-[11px] leading-relaxed text-amber-800">
                <strong>Disclaimer:</strong> Hasil kalkulator ini hanya estimasi. Harga sebenarnya dapat berbeda karena tidak mencakup biaya layanan, pajak, biaya pengiriman, 
                atau ketentuan lain dari masing-masing penyedia. Selalu verifikasi harga final langsung di platform resmi penyedia sebelum bertransaksi.
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 md:py-7">
          {fetchError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-red-800">{fetchError}</p>
            </div>
          ) : (
            <KalkulatorForm items={items} />
          )}
        </div>
      </main>
    );
  }
