"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, register } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";
import { Check, Xmark } from "iconoir-react";

type Tab = "masuk" | "daftar";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

/**
 * Skor kekuatan password 0-4 berdasarkan 4 kriteria sederhana (panjang, huruf besar, angka, karakter simbol)
 */
function getPasswordStrength(password: string): { percent: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { percent: 0, label: "", color: "bg-gray-200" },
    { percent: 25, label: "Sangat lemah", color: "bg-red-600" },
    { percent: 50, label: "Lemah", color: "bg-orange-500" },
    { percent: 75, label: "Cukup kuat", color: "bg-yellow-500" },
    { percent: 100, label: "Kuat", color: "bg-green-600" },
  ];
  return levels[score]!;
}

interface AuthFormProps {
  initialTab: Tab;
  redirectTo: string;
}

export function AuthForm({ initialTab, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);

  // --- Form Masuk ---
  const [masukEmail, setMasukEmail] = useState("");
  const [masukPassword, setMasukPassword] = useState("");
  const [masukError, setMasukError] = useState<string | null>(null);
  const [isMasukSubmitting, setIsMasukSubmitting] = useState(false);

  // --- Form Daftar ---
  const [namaDepan, setNamaDepan] = useState("");
  const [namaBelakang, setNamaBelakang] = useState("");
  const [daftarEmail, setDaftarEmail] = useState("");
  const [daftarPassword, setDaftarPassword] = useState("");
  const [daftarConfirm, setDaftarConfirm] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [daftarError, setDaftarError] = useState<string | null>(null);
  const [isDaftarSubmitting, setIsDaftarSubmitting] = useState(false);
  const [daftarSuccess, setDaftarSuccess] = useState<string | null>(null);

  const strength = getPasswordStrength(daftarPassword);

  function switchTab(next: Tab) {
    setTab(next);
    setMasukError(null);
    setDaftarError(null);
  }

  async function handleMasuk() {
    if (!masukEmail || !EMAIL_REGEX.test(masukEmail)) {
      setMasukError("Masukkan email yang valid.");
      return;
    }
    if (!masukPassword) {
      setMasukError("Kata sandi wajib diisi.");
      return;
    }

    setMasukError(null);
    setIsMasukSubmitting(true);
    try {
      const result = await login({ email: masukEmail, password: masukPassword });
      setAuthSession(result.token, result.investor);
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setMasukError(extractErrorMessage(error, "Gagal masuk. Coba lagi."));
    } finally {
      setIsMasukSubmitting(false);
    }
  }

  async function handleDaftar() {
    const nama = `${namaDepan} ${namaBelakang}`.trim();

    if (!nama) {
      setDaftarError("Nama wajib diisi.");
      return;
    }
    if (!daftarEmail || !EMAIL_REGEX.test(daftarEmail)) {
      setDaftarError("Masukkan email yang valid.");
      return;
    }
    if (daftarPassword.length < 8) {
      setDaftarError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (daftarPassword !== daftarConfirm) {
      setDaftarError("Kata sandi tidak cocok.");
      return;
    }
    if (!tosAccepted) {
      setDaftarError("Anda harus menyetujui syarat & ketentuan.");
      return;
    }

    setDaftarError(null);
    setIsDaftarSubmitting(true);
    try {
      await register({ name: nama, email: daftarEmail, password: daftarPassword });
      setDaftarSuccess("Akun berhasil dibuat! Silakan masuk.");
      setMasukEmail(daftarEmail);
      setTab("masuk");
    } catch (error) {
      setDaftarError(extractErrorMessage(error, "Gagal membuat akun. Coba lagi."));
    } finally {
      setIsDaftarSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-[20px] border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary">
          <span className="text-sm font-bold text-gold">AE</span>
        </div>
        <span className="text-base font-bold tracking-tight text-foreground">Agregator Emas</span>
      </div>

      <div className="mb-6 flex gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => switchTab("masuk")}
          className={cn(
            "-mb-px border-b-2 pb-2.5 text-sm",
            tab === "masuk"
              ? "border-gold font-semibold text-foreground"
              : "border-transparent font-medium text-muted-foreground hover:text-gray-600"
          )}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => switchTab("daftar")}
          className={cn(
            "-mb-px border-b-2 pb-2.5 text-sm",
            tab === "daftar"
              ? "border-gold font-semibold text-foreground"
              : "border-transparent font-medium text-muted-foreground hover:text-gray-600"
          )}
        >
          Daftar
        </button>
      </div>

      {tab === "masuk" ? (
        <div>
          <p className="mb-1 text-xl font-bold text-foreground">Selamat datang kembali</p>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Masuk untuk mengatur notifikasi harga emas.
          </p>

          {daftarSuccess && (
            <p className="mb-3.5 flex items-center gap-1 rounded-[8px] bg-green-50 px-2.5 py-1.5 text-[12px] font-medium text-green-700">
              <Check width={14} height={14} />
              {daftarSuccess}
            </p>
          )}

          <div className="mb-3.5">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Email</label>
            <Input
              type="email"
              placeholder="nama@email.com"
              value={masukEmail}
              onChange={(e) => {
                setMasukEmail(e.target.value);
                setMasukError(null);
              }}
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Kata Sandi</label>
            <Input
              type="password"
              placeholder="Masukkan kata sandi"
              value={masukPassword}
              onChange={(e) => {
                setMasukPassword(e.target.value);
                setMasukError(null);
              }}
            />
          </div>

          {masukError && (
            <p className="mb-3.5 flex items-center gap-1 text-[11px] text-red-600">
              <Xmark width={14} height={14} />
              {masukError}
            </p>
          )}

          <Button className="w-full" onClick={handleMasuk} disabled={isMasukSubmitting}>
            {isMasukSubmitting ? "Memproses..." : "Masuk"}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => switchTab("daftar")}
              className="font-semibold text-foreground hover:underline"
            >
              Daftar sekarang
            </button>
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-1 text-xl font-bold text-foreground">Buat akun baru</p>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Daftar untuk mendapatkan notifikasi harga emas.
          </p>

          <div className="mb-3.5 grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Nama Depan
              </label>
              <Input
                placeholder="Heri"
                value={namaDepan}
                onChange={(e) => {
                  setNamaDepan(e.target.value);
                  setDaftarError(null);
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Nama Belakang
              </label>
              <Input
                placeholder="Irawan"
                value={namaBelakang}
                onChange={(e) => {
                  setNamaBelakang(e.target.value);
                  setDaftarError(null);
                }}
              />
            </div>
          </div>

          <div className="mb-3.5">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Email</label>
            <Input
              type="email"
              placeholder="nama@email.com"
              value={daftarEmail}
              onChange={(e) => {
                setDaftarEmail(e.target.value);
                setDaftarError(null);
              }}
            />
            {daftarEmail && !EMAIL_REGEX.test(daftarEmail) && (
              <p className="mt-1 text-[11px] text-red-600">Masukkan email yang valid.</p>
            )}
          </div>

          <div className="mb-3.5">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Kata Sandi</label>
            <Input
              type="password"
              placeholder="Minimal 8 karakter"
              value={daftarPassword}
              onChange={(e) => {
                setDaftarPassword(e.target.value);
                setDaftarError(null);
              }}
            />
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", strength.color)}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            {strength.label && (
              <p className="mt-1 text-[10px] text-muted-foreground">{strength.label}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Konfirmasi Kata Sandi
            </label>
            <Input
              type="password"
              placeholder="Ulangi kata sandi"
              value={daftarConfirm}
              onChange={(e) => {
                setDaftarConfirm(e.target.value);
                setDaftarError(null);
              }}
            />
          </div>

          <label className="mb-5 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={tosAccepted}
              onChange={(e) => {
                setTosAccepted(e.target.checked);
                setDaftarError(null);
              }}
              className="mt-0.5 size-3.5 shrink-0 accent-primary"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              Saya menyetujui Syarat & Ketentuan dan Kebijakan Privasi Agregator Emas.
            </span>
          </label>

          {daftarError && (
            <p className="mb-3.5 flex items-center gap-1 text-[11px] text-red-600">
              <Xmark width={14} height={14} />
              {daftarError}
            </p>
          )}

          <Button className="w-full" onClick={handleDaftar} disabled={isDaftarSubmitting}>
            {isDaftarSubmitting ? "Memproses..." : "Buat Akun"}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => switchTab("masuk")}
              className="font-semibold text-foreground hover:underline"
            >
              Masuk di sini
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
