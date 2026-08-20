"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProviderLogo } from "@/components/ProviderLogo";
import { getAdminProviders, updateProviderVisibility } from "@/lib/api";
import type { AdminProviderItem } from "@/lib/api";
import { Check, Commodity, EyeClosed, SmartphoneDevice, Xmark } from "iconoir-react";

type Filter = "semua" | "fisik" | "digital" | "hidden";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function formatDateTime(iso: string) {
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso)) + " WIB"
  );
}

interface PendingAction {
  provider: AdminProviderItem;
  nextStatus: "visible" | "hidden";
}

export function AdminProvidersClient() {
  const [providers, setProviders] = useState<AdminProviderItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("semua");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  async function refreshProviders() {
    try {
      const data = await getAdminProviders();
      setProviders(data);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengambil daftar provider."));
    }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getAdminProviders();
        if (!ignore) {
          setProviders(data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(extractErrorMessage(err, "Gagal mengambil daftar provider."));
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = providers ?? [];
    if (filter === "fisik") result = result.filter((p) => p.type === "fisik");
    else if (filter === "digital") result = result.filter((p) => p.type === "digital");
    else if (filter === "hidden") result = result.filter((p) => p.status === "hidden");

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => p.displayName.toLowerCase().includes(q));
    }
    return result;
  }, [providers, filter, search]);

  const stats = useMemo(() => {
    const list = providers ?? [];
    const visible = list.filter((p) => p.status === "visible").length;
    const hidden = list.filter((p) => p.status === "hidden").length;
    /**
     * "Pembaruan terakhir" = waktu terakhir harga diperbarui dari semua provider.
     */
    const latestFetch = list
      .map((p) => p.lastFetchedAt)
      .filter((v): v is string => v !== null)
      .sort()
      .at(-1);
    return { total: list.length, visible, hidden, latestFetch };
  }, [providers]);

  function openConfirm(provider: AdminProviderItem) {
    setPending({ provider, nextStatus: provider.status === "visible" ? "hidden" : "visible" });
  }

  async function handleConfirm() {
    if (!pending) return;
    setIsUpdating(true);
    try {
      await updateProviderVisibility(pending.provider.providerId, pending.nextStatus);
      await refreshProviders();
      toast.success(
        pending.nextStatus === "hidden"
          ? `${pending.provider.displayName} berhasil disembunyikan.`
          : `${pending.provider.displayName} berhasil ditampilkan kembali.`
      );
      setPending(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Gagal mengubah visibilitas provider."));
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-amber-700 uppercase">
          Manajemen Sistem
        </p>
        <h1 className="mb-1 text-[22px] font-bold tracking-tight text-foreground">
          Penyedia Layanan Emas
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Kelola visibilitas penyedia layanan emas yang ditampilkan kepada pengguna.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-1.5 text-[11px] text-muted-foreground">Total Penyedia</p>
          <p className="mb-0.5 text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground">Fisik & Digital</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-1.5 text-[11px] text-muted-foreground">Ditampilkan</p>
          <p className="mb-0.5 text-2xl font-bold text-green-600">{stats.visible}</p>
          <p className="text-[11px] text-muted-foreground">Aktif di sistem</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-1.5 text-[11px] text-muted-foreground">Disembunyikan</p>
          <p className="mb-0.5 text-2xl font-bold text-red-600">{stats.hidden}</p>
          <p className="text-[11px] text-muted-foreground">Tidak tampil ke user</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-1.5 text-[11px] text-muted-foreground">Pembaruan Harga Terakhir</p>
          <p className="mb-0.5 text-sm font-bold text-foreground">
            {stats.latestFetch ? formatDateTime(stats.latestFetch) : "Belum ada data"}
          </p>
        </div>
      </div>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["semua", "fisik", "digital", "hidden"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "semua" && "Semua"}
              {f === "fisik" && (
                <>
                  <Commodity width={16} height={16} /> Emas Fisik
                </>
              )}
              {f === "digital" && (
                <>
                  <SmartphoneDevice width={16} height={16} /> Emas Digital
                </>
              )}
              {f === "hidden" && (
                <>
                  <EyeClosed width={16} height={16} /> Disembunyikan
                </>
              )}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Cari penyedia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[220px]"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && providers === null && (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Memuat daftar provider...
        </div>
      )}

      {!error && providers !== null && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Tidak ada penyedia yang sesuai filter.
        </div>
      )}

      {!error && providers !== null && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead>Penyedia</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Harga</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((provider, index) => {
                const isVisible = provider.status === "visible";

                return (
                  <TableRow
                    key={provider.providerId}
                    className={isVisible ? "" : "opacity-60"}
                  >
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <ProviderLogo
                          logo={provider.logo}
                          displayName={provider.displayName}
                          className="size-8 rounded-lg"
                        />
                        <span className="font-medium text-foreground">
                          {provider.displayName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[13px]">
                        {provider.type === "fisik" 
                          ? <Commodity width={16} height={16} />
                          : <SmartphoneDevice width={16} height={16} />
                        }
                        {provider.type === "fisik" ? "Fisik" : "Digital"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          isVisible
                            ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                            : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {isVisible ? "Ditampilkan" : "Disembunyikan"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          "flex items-center gap-1 text-[12px] font-semibold " +
                          (provider.lastFetchedAt ? "text-green-600" : "text-red-500")
                        }
                      >
                        {provider.lastFetchedAt 
                          ? <Check width={14} height={14} />
                          : <Xmark width={14} height={14} />
                        }
                        {provider.lastFetchedAt ? "Tersimpan" : "Belum ada"}
                    </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                          <span className="flex items-center gap-1 text-[13px] font-regular " >
                            {provider.lastFetchedAt ? formatDateTime(provider.lastFetchedAt) : "Belum ada data"}
                          </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className={
                          isVisible
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }
                        onClick={() => openConfirm(provider)}
                      >
                        {isVisible ? "Sembunyikan" : "Tampilkan"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.nextStatus === "hidden" ? "Sembunyikan" : "Tampilkan"}{" "}
              {pending?.provider.displayName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.nextStatus === "hidden"
                ? `Penyedia ${pending?.provider.displayName} tidak akan ditampilkan kepada pengguna di halaman publik.`
                : `Penyedia ${pending?.provider.displayName} akan kembali ditampilkan kepada pengguna di halaman publik.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-[10px] bg-muted p-3 text-[13px] leading-relaxed text-gray-700">
            <strong>Catatan:</strong> Data penyedia dan riwayat harga tetap tersimpan di
            sistem. Perubahan ini hanya memengaruhi visibilitas di halaman publik.
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isUpdating}
              className={
                pending?.nextStatus === "hidden"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              {isUpdating
                ? "Memproses..."
                : pending?.nextStatus === "hidden"
                  ? "Ya, Sembunyikan"
                  : "Ya, Tampilkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
