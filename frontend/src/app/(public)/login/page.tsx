import { AuthForm } from "@/components/AuthForm";

// searchParams berupa Promise di Next.js versi ini (App Router) — dipakai
// untuk membaca ?redirect=... yang disisipkan halaman lain (mis. gerbang auth
// NotifikasiClient) supaya investor kembali ke halaman yang dituju semula
// setelah berhasil login, bukan selalu ke beranda.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <AuthForm initialTab="masuk" redirectTo={redirect || "/"} />
    </main>
  );
}
