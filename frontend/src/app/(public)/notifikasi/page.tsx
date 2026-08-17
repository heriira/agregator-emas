import { getPrices } from "@/lib/api";
import { NotifikasiClient } from "@/components/NotifikasiClient";

export const dynamic = "force-dynamic";

export default async function NotifikasiPage() {
  let providers: Awaited<ReturnType<typeof getPrices>> = [];
  let fetchError: string | null = null;

  try {
    providers = await getPrices();
  } catch (error) {
    console.error("Gagal mengambil data harga dari backend:", error);
    fetchError = "Tidak bisa memuat data harga saat ini. Coba muat ulang halaman.";
  }

  return (
    <main className="flex-1">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1100px] px-6 py-7">
          <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-foreground">
            Notifikasi Harga Emas
          </h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Atur target harga dan kami akan mengirimkan notifikasi melalui surel
            saat harga mencapai target yang kamu tentukan.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 py-7">
        {fetchError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-red-800">{fetchError}</p>
          </div>
        ) : (
          <NotifikasiClient providers={providers} />
        )}
      </div>
    </main>
  );
}
