"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KalkulatorResultCard } from "@/components/KalkulatorResultCard";
import { formatRupiah, formatGram } from "@/lib/format";
import type { GoldPriceItem } from "@/lib/api";
import { ArrowDown, ArrowUp, Calculator, Commodity, SmartphoneDevice, WarningCircle } from "iconoir-react";

type Kategori = "fisik" | "digital";
type Mode = "beli" | "jual";
type InputType = "gram" | "rupiah";

/**
 * Besaran gramasi cetakan emas fisik
 */
const CETAKAN_OPTIONS = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];

interface CalculatedResult {
  item: GoldPriceItem;
  gram: number;
  rupiah: number;
}

interface KalkulatorFormProps {
  items: GoldPriceItem[];
}

export function KalkulatorForm({ items }: KalkulatorFormProps) {
  const [kategori, setKategoriState] = useState<Kategori>("fisik");
  const [mode, setModeState] = useState<Mode>("beli");
  const [selectedCetakan, setSelectedCetakan] = useState<number | null>(null);
  const [inputType, setInputTypeState] = useState<InputType>("gram");
  const [nilaiInput, setNilaiInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CalculatedResult[] | null>(null);
  const [excludedFromResults, setExcludedFromResults] = useState(0);
  const [paramsOpen, setParamsOpen] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);
  const isGramInput = kategori === "fisik" ? true : inputType === "gram";

  function setKategori(value: Kategori) {
    setKategoriState(value);
    setSelectedCetakan(null);
    setResults(null);
  }

  function setMode(value: Mode) {
    setModeState(value);
    setResults(null);
  }

  function setInputType(value: InputType) {
    setInputTypeState(value);
    setResults(null);
  }

  function handleCetakanClick(value: number) {
    setSelectedCetakan(value);
    setResults(null);
  }

  function handleHitung() {
    let gramTarget: number | null = null;
    let rupiahTarget: number | null = null;

    if (kategori === "fisik") {
      if (!selectedCetakan) {
        setError("Pilih cetakan terlebih dahulu.");
        return;
      }
      gramTarget = selectedCetakan;
    } else {
      const value = parseFloat(nilaiInput);
      if (!value || value <= 0) {
        setError("Masukkan nilai yang valid.");
        return;
      }
      if (inputType === "gram") gramTarget = value;
      else rupiahTarget = value;
    }

    setError(null);

    const itemsForKategoriRaw = items.filter((item) => item.type === kategori);
    const itemsForKategori =
      mode === "jual"
        ? itemsForKategoriRaw.filter((item) => item.buybackPrice !== null)
        : itemsForKategoriRaw;
    const excludedCount = itemsForKategoriRaw.length - itemsForKategori.length;

    const calculated: CalculatedResult[] = itemsForKategori.map((item) => {
    const hargaAktif = mode === "beli" ? item.sellPrice : item.buybackPrice!;
    const gram = gramTarget !== null ? gramTarget : rupiahTarget! / hargaAktif;
    const rupiah = gramTarget !== null ? gramTarget * hargaAktif : rupiahTarget!;      
    return { item, gram, rupiah };
    });

    /**
     * Urutan dari yang "terbaik dulu" tergantung mode + jenis input:
     * - beli + gram  : total rupiah yang harus dibayar PALING KECIL = termurah.
     * - beli + rupiah: emas yang didapat PALING BANYAK = terbaik.
     * - jual + gram  : uang yang diterima PALING BANYAK = terbaik.
     * - jual + rupiah: emas yang perlu dijual PALING SEDIKIT = terbaik
     */ 
    const isGram = gramTarget !== null;
    const sorted = [...calculated].sort((a, b) => {
      if (mode === "beli") {
        return isGram ? a.rupiah - b.rupiah : b.gram - a.gram;
      }
      return isGram ? b.rupiah - a.rupiah : a.gram - b.gram;
    });

    setResults(sorted);
    setExcludedFromResults(excludedCount);

    /**
     * Di tablet & mobile, panel form otomatis ditutup lalu scroll ke daftar target, sedangkan di desktop panel tetap terbuka sehingga langkah ini dilewati.
     */
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setParamsOpen(false);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function handleReset() {
    setSelectedCetakan(null);
    setNilaiInput("");
    setError(null);
    setResults(null);
    setExcludedFromResults(0);
  }

  const best = results && results.length > 0 ? results[0]! : null;
  const worst = results && results.length > 0 ? results[results.length - 1]! : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
      {/* PANEL KIRI */}
      <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-[76px]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Parameter Perhitungan
          </h2>
          {/* Toggle collapse/expand hanya tampil di tablet & mobile, di desktop panel selalu terbuka. */}
          <button
            type="button"
            onClick={() => setParamsOpen((value) => !value)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground lg:hidden"
          >
            Parameter {paramsOpen ? "▲" : "▼"}
          </button>
        </div>

        <div className={paramsOpen ? "block" : "hidden lg:block"}>
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Kategori Emas
          </p>
          <div className="flex gap-1 rounded-[10px] bg-muted p-1">
            <Button
              variant={kategori === "fisik" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setKategori("fisik")}
            >
              <Commodity width={16} height={16} /> Emas Fisik
            </Button>
            <Button
              variant={kategori === "digital" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setKategori("digital")}
            >
              <SmartphoneDevice width={16} height={16} /> Emas Digital
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Mode Transaksi
          </p>
          <div className="flex gap-2">
            <Button
              variant={mode === "beli" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("beli")}
            >
              <ArrowDown width={16} height={16} /> Beli
            </Button>
            <Button
              variant={mode === "jual" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("jual")}
            >
              <ArrowUp width={16} height={16} /> Jual
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {mode === "beli"
              ? "Menghitung berdasarkan harga beli dari penyedia ke investor."
              : "Menghitung berdasarkan harga jual kembali (buyback) dari investor ke penyedia."}
          </p>
        </div>

        {kategori === "fisik" ? (
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
              Pilih Cetakan
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {CETAKAN_OPTIONS.map((value) => (
                <Button
                  key={value}
                  variant={selectedCetakan === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCetakanClick(value)}
                >
                  {value >= 1000 ? "1 kg" : `${value} gr`}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Emas fisik tersedia dalam cetakan standar. Pilih gramasi yang ingin dihitung.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
              Jenis Input
            </p>
            <div className="mb-2 flex gap-0.5 rounded-[10px] bg-muted p-1">
              <Button
                variant={inputType === "gram" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setInputType("gram")}
              >
                Gramasi
              </Button>
              <Button
                variant={inputType === "rupiah" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setInputType("rupiah")}
              >
                Nominal (Rp)
              </Button>
            </div>
            <div className="relative">
              {inputType === "rupiah" && (
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>
              )}
              <Input
                type="number"
                min={0}
                value={nilaiInput}
                onChange={(e) => {
                  setNilaiInput(e.target.value);
                  setError(null);
                }}
                placeholder={inputType === "gram" ? "Contoh: 0.5" : "Contoh: 5000000"}
                className={inputType === "rupiah" ? "pl-8" : ""}
              />
              {inputType === "gram" && (
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                  gram
                </span>
              )}
            </div>
            {error && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-red-600">
                <WarningCircle width={14} height={14} />
                {error}
              </p>
            )}
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Emas digital dapat dibeli mulai dari 0,01 gram.
            </p>
          </div>
        )}

        {kategori === "fisik" && error && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-red-600">
            <WarningCircle width={14} height={14} />
            {error}
          </p>
        )}

        <div className="my-4 h-px bg-border" />

        <Button className="w-full" onClick={handleHitung}>
          Hitung Perbandingan
        </Button>
        <Button variant="ghost" className="mt-1.5 w-full text-muted-foreground" onClick={handleReset}>
          Reset
        </Button>
        </div>
      </div>

      {/* PANEL KANAN: hasil */}
      <div ref={resultRef}>
        {!results && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <Calculator width={32} height={32} className="mb-3 text-foreground" />
            <p className="mb-1.5 text-sm font-semibold text-gray-700">Siap Menghitung</p>
            <p className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">
              Pilih kategori, mode transaksi, dan masukkan nilai, lalu tekan{" "}
              <strong>Hitung Perbandingan</strong>.
            </p>
          </div>
        )}

        {results && results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              Belum ada data emas {kategori === "fisik" ? "fisik" : "digital"} saat ini
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Perbandingan belum bisa dihitung karena belum ada penyedia dengan data harga di kategori ini.
            </p>
          </div>
        )}

        {results && best && worst && (
          <>
            <div className="mb-3.5 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="mb-0.5 text-[11px] text-gray-800">
                    Estimasi {mode === "beli" ? "pembelian" : "penjualan kembali"}{" "}
                    {kategori === "fisik" ? "emas fisik" : "emas digital"}
                  </p>
                  <p className="text-[13px] font-bold text-foreground">
                    Input: {isGramInput ? formatGram(best.gram) : formatRupiah(best.rupiah)} ·{" "}
                    {results.length} penyedia dibandingkan
                  </p>
                </div>
                <div className="text-left">
                  <p className="mb-0.5 text-[10px] text-muted-foreground">
                    {mode === "beli"
                      ? "Potensi penghematan (termurah vs termahal)"
                      : "Selisih hasil terbaik vs terburuk"}
                  </p>
                  <p className="text-base font-bold text-green-700">
                    {isGramInput
                      ? formatRupiah(Math.abs(best.rupiah - worst.rupiah))
                      : formatGram(Math.abs(best.gram - worst.gram))}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-2.5 flex items-center justify-between px-1">
              <p className="text-[12px] font-semibold text-gray-700">
                {results.length} penyedia
              </p>
              <p className="text-[11px] text-muted-foreground">
                Diurutkan dari {mode === "beli" ? "termurah" : "terbaik"}
              </p>
            </div>

            {excludedFromResults > 0 && (
              <p className="mb-2.5 px-1 text-[11px] text-muted-foreground">
                {excludedFromResults} Penyedia tidak tersedia karena data harga jual (buyback) tidak tersedia.
              </p>
            )}

            {results.map((result) => (
              <KalkulatorResultCard
                key={result.item.source}
                item={result.item}
                mode={mode}
                isGramInput={isGramInput}
                gram={result.gram}
                rupiah={result.rupiah}
                rank={
                  result === best && best !== worst
                    ? "best"
                    : result === worst && best !== worst
                      ? "worst"
                      : null
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
