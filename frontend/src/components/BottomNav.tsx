"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Commodity, Calculator, Bell } from "iconoir-react";

const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "Harga Emas", icon: Commodity },
  { href: "/kalkulator", label: "Kalkulator", icon: Calculator },
  { href: "/notifikasi", label: "Notifikasi", icon: Bell },
];

/**
 * Bottom navbar mobile disembunyikan saat scroll ke bawah dan ditampilkan saat scroll ke atas atau ketika pengguna berhenti scrolling selama 300ms.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 64;
      setVisible(!isScrollingDown);
      lastScrollY = currentScrollY;

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setVisible(true), 300);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-[#e5e7eb] bg-white transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 border-t-2 text-[11px] font-medium transition-colors",
              isActive ? "border-gold text-[#111827]" : "border-transparent text-[#9ca3af]"
            )}
          >
            <item.icon width={22} height={22} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
