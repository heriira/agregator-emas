"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAdminToken } from "@/lib/auth";

const LOGIN_PATH = "/admin/login";

/**
 * Status mounted hanya berubah sekali, dari false menjadi true.
 * Setelah itu tidak ada perubahan lagi, jadi subscribe tidak perlu melakukan apa-apa.
 */
function subscribeMounted() {
  return () => {};
}
function getMountedSnapshot() {
  return true;
}

/**
 * Di server, komponen belum dianggap mounted di browser, jadi nilainya false.
 * Nilai ini membuat render awal server dan client tetap sama sehingga tidak terjadi hydration mismatch.
 * Setelah komponen selesai mount, useSyncExternalStore akan menggunakan nilai true tanpa perlu useEffect atau setState tambahan.
 */
function getServerMountedSnapshot() {
  return false;
}

/**
 * Menentukan apakah komponen sudah selesai mount di client.
 * Nilai ini digunakan agar pengecekan token dan redirect tidak dilakukan terlalu cepat saat halaman pertama kali dibuka atau di-refresh.
 */
function useHasMounted(): boolean {
  return useSyncExternalStore(subscribeMounted, getMountedSnapshot, getServerMountedSnapshot);
}

/**
 * Menjadi gerbang autentikasi sekaligus menyediakan layout admin dengan sidebar.
 * Komponen ini berlaku untuk semua halaman di bawah /admin, kecuali halaman login.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAdminToken();
  const isLoginPage = pathname === LOGIN_PATH;
  
  /**
   * Menunggu sampai client selesai membaca token dari localStorage sebelum mengambil keputusan redirect.
   * Ini mencegah pengguna yang sudah login diarahkan ke halaman login saat melakukan hard reload karena token belum terbaca pada render pertama.
   */
  const mounted = useHasMounted();

  useEffect(() => {
    if (!mounted) return;
    if (!isLoginPage && !token) {
      router.replace(LOGIN_PATH);
    }
  }, [mounted, isLoginPage, token, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

   /**
   * Selama status mount atau token belum siap, jangan tampilkan halaman admin terlebih dahulu.
   * Setelah keduanya siap, barulah halaman admin dirender atau pengguna diarahkan ke halaman login.
   */
  if (!mounted || !token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-[220px] flex-1 p-7">{children}</main>
      <Toaster position="bottom-center" />
    </div>
  );
}
