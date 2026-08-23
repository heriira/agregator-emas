"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthToken, getStoredInvestor, clearAuthSession } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/", label: "Harga Emas" },
  { href: "/kalkulator", label: "Kalkulator" },
  { href: "/notifikasi", label: "Notifikasi" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthToken();
  const investor = token ? getStoredInvestor() : null;

  function handleLogout() {
    clearAuthSession();
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="relative mx-auto flex h-14 max-w-[1100px] items-center gap-8 px-6">
        <Link href="/" className="mr-2 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-[13px] font-bold text-gold">AE</span>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            Agregator Emas
          </span>
        </Link>
        {/* Menu navigasi disembunyikan di mobile (< 768px) dipindah ke BottomNav. */}
        <div className="hidden h-full items-stretch gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center px-3.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {investor ? (
            <>
              <Link
                href="/profil"
                className="hidden text-[13px] text-muted-foreground hover:text-foreground sm:inline"
              >
                Halo, <strong className="font-semibold text-foreground">{investor.name}</strong>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Masuk
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
                Daftar
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
