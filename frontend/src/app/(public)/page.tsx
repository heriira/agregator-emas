import { getPrices, getWorldGoldPrice } from "@/lib/api";
import { PriceExplorer } from "@/components/PriceExplorer";
import { XauUsdTicker } from "@/components/XauUsdTicker";
import { EducationSection } from "@/components/EducationSection";
import { WarningCircle } from "iconoir-react";
import { Commodity } from "iconoir-react";
import { SmartphoneDevice } from "iconoir-react";
/**
 * Halaman ini SELALU mengambil data terbaru dari backend saat di-request
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof getPrices>> = [];
  let fetchError: string | null = null;

  try {
    items = await getPrices();
  } catch (error) {
    console.error("Gagal mengambil data harga dari backend:", error);
    fetchError = "Tidak bisa memuat data harga saat ini. Coba muat ulang halaman.";
  }

  /**
   * Harga emas dunia diambil terpisah dari getPrices()
   */
  let worldPrice: Awaited<ReturnType<typeof getWorldGoldPrice>> = null;
  try {
    worldPrice = await getWorldGoldPrice();
  } catch (error) {
    console.error("Gagal mengambil harga emas dunia dari backend:", error);
  }

  const jumlahFisik = items.filter((item) => item.type === "fisik").length;
  const jumlahDigital = items.filter((item) => item.type === "digital").length;

  return (
    <main className="flex-1">
      {/* HERO SECTION*/}
      <div className="border-b border-border bg-card">
        <div
          className={
            "mx-auto grid max-w-[1100px] items-center gap-6 px-4 py-8 md:gap-10 md:px-6 md:py-12 " +
            (worldPrice ? "lg:grid-cols-[1fr_380px]" : "")
          }
        >
          {/* BAGIAN KIRI: TEKS */}
          <div>

            <h1 className="mb-3 max-w-xl text-2xl leading-[1.25] font-bold tracking-tight text-foreground md:text-3xl">
              Bandingkan Harga Emas
              <br />
              <span className="text-gold">Fisik &amp; Digital</span> di Indonesia
            </h1>

            <p className="mb-5 max-w-[460px] text-sm leading-relaxed text-muted-foreground">
              Temukan harga terbaik dari berbagai penyedia emas terpercaya dalam satu halaman. Hemat waktu, dan ambil keputusan lebih sesuai.
            </p>

            <div className="mb-5 flex flex-wrap gap-2.5">
              <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-4 py-2.5">
                <Commodity width={24} height={24} className="text-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Emas Fisik</p>
                  <p className="text-[13px] font-semibold text-foreground">
                    {jumlahFisik} Produsen
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-4 py-2.5">
                <SmartphoneDevice width={24} height={24} className="text-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Emas Digital</p>
                  <p className="text-[13px] font-semibold text-foreground">
                    {jumlahDigital} Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-2.5">
              <WarningCircle width={24} height={24} className="mt-px shrink-0 text-amber-800" />
              <p className="text-[11px] leading-relaxed text-amber-800">
                <strong>Disclaimer:</strong> Data harga bersumber dari layanan agregasi publik, bukan dari API resmi penyedia. Informasi ini
                hanya untuk referensi dan bukan merupakan saran investasi. Selalu verifikasi langsung ke platform resmi sebelum bertransaksi.
              </p>
            </div>
          </div>

          {/* BAGIAN KANAN: CHART XAU/USD */}
          {worldPrice && <XauUsdTicker data={worldPrice} />}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-[1100px] px-4 py-7 md:px-6">
        {fetchError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-red-800">{fetchError}</p>
          </div>
        ) : (
          <>
            <PriceExplorer items={items} />
            <EducationSection />
          </>
        )}
      </div>
    </main>
  );
}
