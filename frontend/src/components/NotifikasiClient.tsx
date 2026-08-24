"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCard } from "@/components/AlertCard";
import { ProviderLogo } from "@/components/ProviderLogo";
import { formatRupiah } from "@/lib/format";
import { useAuthToken } from "@/lib/auth";
import { getAlerts, createAlert, deleteAlert } from "@/lib/api";
import type { GoldPriceItem, PriceAlertItem } from "@/lib/api";
import { Bell, CheckCircle, Commodity, InfoCircle, SmartphoneDevice, WarningCircle } from "iconoir-react";

type Kategori = "fisik" | "digital";
type Jenis = "beli" | "jual";
type TabStatus = "aktif" | "selesai";

/**
 * Mengambil pesan error dari server jika tersedia, agar user mendapat informasi yang lebih jelas dan tidak generik.
 */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

interface NotifikasiClientProps {
  providers: GoldPriceItem[];
}

/**
 * Halaman notifikasi hanya bisa digunakan oleh pengguna yang sudah login.
 * Jika token belum ditemukan, tampilkan pesan untuk login.
 *
 * useAuthToken juga akan membuat halaman ini ikut diperbarui ketika pengguna
 * login atau logout, jadi tidak perlu melakukan refresh halaman secara manual.
 */

export function NotifikasiClient({ providers }: NotifikasiClientProps) {
  const token = useAuthToken();

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <Bell width={32} height={32} className="mb-3 text-foreground" />
        <p className="mb-1.5 text-sm font-semibold text-gray-700">
          Masuk untuk mengatur notifikasi
        </p>
        <p className="mb-4 max-w-[320px] text-xs leading-relaxed text-muted-foreground">
          Fitur target notifikasi harga hanya tersedia untuk investor yang sudah
          login.
        </p>
         {/* Setelah login berhasil, pengguna akan dikembalikan ke halaman url ?redirect=/notifikasi */}
        <Button size="sm" nativeButton={false} render={<Link href="/login?redirect=/notifikasi" />}>
          Masuk Sekarang
        </Button>
      </div>
    );
  }

  return <NotifikasiContent providers={providers} />;
}

function NotifikasiContent({ providers }: NotifikasiClientProps) {
  const [kategori, setKategori] = useState<Kategori>("fisik");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [jenis, setJenis] = useState<Jenis>("beli");
  const [targetInput, setTargetInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PriceAlertItem[] | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>("aktif");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  async function refreshAlerts() {
    try {
      const data = await getAlerts();
      setAlerts(data);
      setAlertsError(null);
      return data;
    } catch (error) {
      setAlertsError(extractErrorMessage(error, "Gagal mengambil daftar target notifikasi."));
      return null;
    }
  }

  /**
   * pollAlertUntilResolved hanya dipanggil jika harga yang di input = harga saat ini, agar card notifikasi bisa di cek dan dipindah ke tab selesai begitu email terkirim.
   */
  function pollAlertUntilResolved(alertId: number, attemptsLeft: number) {
    if (attemptsLeft <= 0) return;
    setTimeout(async () => {
      const data = await refreshAlerts();
      const target = data?.find((item) => item.alertId === alertId);
      if (target && target.status === "selesai") return;
      pollAlertUntilResolved(alertId, attemptsLeft - 1);
    }, 4000);
  }

  /**
   * Daftar target notifikasi diambil dari browser setelah komponen tampil.
   * Data ini membutuhkan token login yang hanya tersedia di localStorage, sehingga tidak bisa diambil langsung saat server membuat halaman.
   * Variabel ignore digunakan untuk mengabaikan hasil request jika pengguna sudah berpindah halaman sebelum request selesai.
   */

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const data = await getAlerts();
        if (!ignore) {
          setAlerts(data);
          setAlertsError(null);
        }
      } catch (error) {
        if (!ignore) {
          setAlertsError(extractErrorMessage(error, "Gagal mengambil daftar target notifikasi."));
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const providersForKategori = providers.filter((item) => item.type === kategori);
  const selectedProvider = providersForKategori.find((item) => item.source === selectedSource);
  const buybackUnavailable = selectedProvider?.buybackPrice === null;
  
  /**
   * Sistem menentukan arah notifikasi berdasarkan posisi harga target terhadap harga saat ini. 
   * Jika target tepat sama dengan harga saat ini, target dianggap sudah tercapai dan pengguna diberi peringatan sebelum menyimpan.
   */
  const targetValue = parseFloat(targetInput);
  const currentReferencePrice = selectedProvider
    ? jenis === "beli"
      ? selectedProvider.sellPrice
      : selectedProvider.buybackPrice
    : null;
  const targetAlreadyMet =
    currentReferencePrice !== null &&
    !Number.isNaN(targetValue) &&
    targetValue > 0 &&
    targetValue === currentReferencePrice;

  function handleSetKategori(value: Kategori) {
    setKategori(value);
    setSelectedSource(null);
  }

  function handleSelectProvider(item: GoldPriceItem) {
    setSelectedSource(item.source);
    /**
     * Jika penyedia tidak memiliki harga jual kembali dan pengguna sedang memilih "Jual", otomatis kembali ke pilihan "Beli" karena "Jual" tidak tersedia.
     */
    if (item.buybackPrice === null && jenis === "jual") {
      setJenis("beli");
    }
  }

  async function handleSubmit() {
    if (!selectedSource) {
      setFormError("Pilih penyedia terlebih dahulu.");
      return;
    }

    /**
     * Periksa kembali pilihan "Jual" sebelum mengirim data ke server. 
     * Dengan begitu pengguna langsung mendapat informasi tanpa perlu menunggu server menolak permintaan tersebut.
     */

    if (jenis === "jual" && buybackUnavailable) {
      setFormError("Penyedia ini tidak menyediakan harga jual (buyback).");
      return;
    }

    const value = parseFloat(targetInput);
    if (!value || value <= 0) {
      setFormError("Masukkan harga target yang valid.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const created = await createAlert({ providerSource: selectedSource, targetPrice: value, priceType: jenis });
      setSuccessMessage("Target notifikasi berhasil disimpan!");
      setTargetInput("");
      setSelectedSource(null);
      await refreshAlerts();

      /**
       * Hanya di-poll kalau target di-set sama persis dengan harga saat ini (targetAlreadyMet).
       */
      if (targetAlreadyMet) {
        pollAlertUntilResolved(created.alertId, 5);
      }

      /**
       * Pesan berhasil hanya ditampilkan sebentar agar tidak memenuhi tampilan.
       */
      setTimeout(() => setSuccessMessage(null), 3000);

      /**
       * Di tablet & mobile, panel form otomatis ditutup lalu scroll ke daftar target, sedangkan di desktop panel tetap terbuka sehingga langkah ini dilewati.
       */
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setFormOpen(false);
        requestAnimationFrame(() => {
          listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch (error) {
      setFormError(extractErrorMessage(error, "Gagal membuat target notifikasi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(alertId: number) {
    setDeletingId(alertId);
    try {
      await deleteAlert(alertId);
      await refreshAlerts();
    } catch (error) {
      setAlertsError(extractErrorMessage(error, "Gagal menghapus target notifikasi."));
    } finally {
      setDeletingId(null);
    }
  }

  const alertsForTab = (alerts ?? []).filter((alert) => alert.status === activeTab);
  const countAktif = (alerts ?? []).filter((alert) => alert.status === "aktif").length;
  const countSelesai = (alerts ?? []).filter((alert) => alert.status === "selesai").length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
      {/* PANEL KIRI */}
      <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-[76px]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Tambah Target Notifikasi
          </h2>
          {/* Toggle collapse/expand hanya tampil di tablet & mobile, di desktop panel selalu terbuka. */}
          <button
            type="button"
            onClick={() => setFormOpen((value) => !value)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground lg:hidden"
          >
            Tambah Target {formOpen ? "▲" : "▼"}
          </button>
        </div>

        <div className={formOpen ? "block" : "hidden lg:block"}>
        <div className="mb-3.5">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Kategori Emas
          </p>
          <div className="flex gap-1 rounded-[10px] bg-muted p-1">
            <Button
              variant={kategori === "fisik" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => handleSetKategori("fisik")}
            >
              <Commodity width={20} height={20} /> Fisik
            </Button>
            <Button
              variant={kategori === "digital" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => handleSetKategori("digital")}
            >
              <SmartphoneDevice width={20} height={20} /> Digital
            </Button>
          </div>
        </div>

        <div className="mb-3.5">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Pilih Penyedia
          </p>
          {providersForKategori.length === 0 ? (
            <p className="rounded-[10px] border border-dashed border-border p-3 text-[11px] text-muted-foreground">
              Belum ada penyedia dengan data harga di kategori ini.
            </p>
          ) : (
            <div className="flex max-h-[200px] flex-col gap-1.5 overflow-y-auto">
              {providersForKategori.map((item) => {
                const isSelected = item.source === selectedSource;
                return (
                  <button
                    key={item.source}
                    type="button"
                    onClick={() => handleSelectProvider(item)}
                    className={
                      "flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-left transition-colors " +
                      (isSelected
                        ? "border-gold bg-amber-50"
                        : "border-border bg-card hover:border-gold/50")
                    }
                  >
                    <ProviderLogo
                      logo={item.logo}
                      displayName={item.displayName}
                      className="size-7 rounded-md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-foreground">
                        {item.displayName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatRupiah(item.sellPrice)}/gram
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-3.5">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Jenis Harga
          </p>
          <div className="flex gap-2">
            <Button
              variant={jenis === "beli" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setJenis("beli")}
            >
              Harga Beli
            </Button>
            <Button
              variant={jenis === "jual" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              disabled={buybackUnavailable}
              onClick={() => setJenis("jual")}
            >
              Harga Jual
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {jenis === "beli"
              ? "Notifikasi dikirim saat harga beli menyentuh target, arah (naik/turun) otomatis mengikuti posisi target terhadap harga saat ini."
              : "Notifikasi dikirim saat harga jual menyentuh target, arah (naik/turun) otomatis mengikuti posisi target terhadap harga saat ini."}
          </p>
          {buybackUnavailable && (
            <p className="mt-1.5 rounded-[8px] bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground">
              {selectedProvider?.displayName}{" "}
              tidak menyediakan harga jual (buyback) — hanya target &quot;Harga
              Beli&quot; yang tersedia untuk penyedia ini.
            </p>
          )}
        </div>

        <div className="mb-3.5">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Harga Target (Rp/gram)
          </p>
          <Input
            type="number"
            min={0}
            value={targetInput}
            onChange={(e) => {
              setTargetInput(e.target.value);
              setFormError(null);
            }}
            placeholder="Contoh: 1700000"
          />

          {selectedProvider && (
            <div className="mt-2 rounded-[10px] border border-border bg-muted p-2.5">
              <p className="mb-1.5 text-[10px] text-muted-foreground">
                Harga saat ini ({selectedProvider.displayName})
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Harga Beli</p>
                  <p className="text-[12px] font-semibold text-foreground">
                    {formatRupiah(selectedProvider.sellPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Harga Jual</p>
                  <p className="text-[12px] font-semibold text-foreground">
                    {selectedProvider.buybackPrice !== null
                      ? formatRupiah(selectedProvider.buybackPrice)
                      : "Tidak tersedia"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {targetAlreadyMet && (
            <p className="mt-1.5 flex items-start gap-1.5 rounded-[8px] bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
              <InfoCircle width={16} height={16} className="mt-px shrink-0" />
              <span>
                Target ini persis sama dengan harga saat ini notifikasi akan langsung terkirim begitu disimpan.
              </span>
            </p>
          )}

          {formError && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600">
              <WarningCircle width={14} height={14} />
              {formError}
            </p>
          )}
        </div>

        <div className="my-3.5 h-px bg-border" />

        <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Target Notifikasi"}
        </Button>

        {successMessage && (
          <p className="mt-2 flex items-center justify-center gap-1 rounded-[8px] bg-green-50 px-2.5 py-1.5 text-center text-[11px] font-medium text-green-700">
            <CheckCircle width={14} height={14} />
            {successMessage}
          </p>
        )}
        </div>
      </div>

      {/* PANEL KANAN: daftar target */}
      <div ref={listRef}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            <Button
              variant={activeTab === "aktif" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("aktif")}
            >
              Aktif ({countAktif})
            </Button>
            <Button
              variant={activeTab === "selesai" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("selesai")}
            >
              Selesai ({countSelesai})
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Notifikasi dikirim sekali saat target tercapai
          </p>
        </div>

        {alertsError && (
          <div className="mb-3 rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-800">
            {alertsError}
          </div>
        )}

        {alerts === null && !alertsError ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
            Memuat daftar target notifikasi...
          </div>
        ) : alertsForTab.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              {activeTab === "aktif" ? "Belum ada target aktif" : "Belum ada notifikasi terkirim"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeTab === "aktif"
                ? "Tambahkan target harga di panel kiri."
                : "Notifikasi yang sudah terkirim akan muncul di sini."}
            </p>
          </div>
        ) : (
          alertsForTab.map((alert) => {
            const providerNow = providers.find((item) => item.source === alert.provider.source);
            const currentPrice = providerNow
              ? alert.priceType === "beli"
                ? providerNow.sellPrice
                : providerNow.buybackPrice
              : null;

            return (
              <AlertCard
                key={alert.alertId}
                alert={alert}
                currentPrice={currentPrice}
                onDelete={() => handleDelete(alert.alertId)}
                isDeleting={deletingId === alert.alertId}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
