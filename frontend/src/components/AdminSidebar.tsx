"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getStoredAdmin, clearAdminSession } from "@/lib/auth";
import { BellNotification, Group, KeyframesCouple, LogOut } from "iconoir-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Penyedia Layanan", icon: KeyframesCouple },
  { href: "/admin/investors", label: "Pengguna Terdaftar", icon: Group },
  { href: "/admin/notifications", label: "Log Notifikasi", icon: BellNotification },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = getStoredAdmin();

  function handleLogout() {
    clearAdminSession();
    router.push("/admin/login");
  }

  return (
    <div className="fixed top-0 left-0 flex h-screen w-[220px] flex-col border-r border-border bg-card p-3 py-5">
      <div className="mb-7 flex items-center gap-2 px-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-[13px] font-bold text-gold">AE</span>
        </div>
        <div>
          <p className="text-[13px] font-bold text-foreground">Agregator Emas</p>
          <p className="text-[10px] text-muted-foreground">Dashboard Admin</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        <p className="mb-1 px-3 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          Utama
        </p>
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon width={18} height={18} /> {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="text-[11px] font-bold text-gold">
              {admin?.name.charAt(0).toUpperCase() ?? "A"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {admin?.name ?? "Admin"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{admin?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut width={18} height={18} /> Keluar
        </button>
      </div>
    </div>
  );
}
