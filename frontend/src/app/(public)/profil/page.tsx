import { ProfileClient } from "@/components/ProfileClient";

/**
 * Data profil (nama, email) selalu diambil ulang setiap halaman ini dibuka.
 */
export const dynamic = "force-dynamic";

export default function ProfilPage() {
  return (
    <main className="flex-1">
      {/* HEADER */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 md:py-12">
          <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-foreground">
            Profil Saya
          </h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Kelola informasi akun dan kata sandi Anda.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-[560px] px-4 py-8 md:px-6 md:py-7">
        <ProfileClient />
      </div>
    </main>
  );
}
