"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/api";
import { Check, Xmark } from "iconoir-react";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

interface ResetPasswordFormProps {
  token: string | undefined;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!token) {
      setError("Link reset tidak valid. Silakan minta link baru.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mereset kata sandi. Coba lagi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-[20px] border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xl font-bold text-foreground">Buat kata sandi baru</p>
      <p className="mb-5 text-[13px] text-muted-foreground">
        Masukkan kata sandi baru untuk akun Agregator Emas Anda.
      </p>

      {success ? (
        <p className="flex items-start gap-1.5 rounded-[8px] bg-green-50 px-2.5 py-2 text-[12px] leading-relaxed font-medium text-green-700">
          <Check width={14} height={14} className="mt-0.5 shrink-0" />
          Kata sandi berhasil diperbarui. Mengarahkan ke halaman masuk...
        </p>
      ) : !token ? (
        <p className="flex items-start gap-1.5 rounded-[8px] bg-red-50 px-2.5 py-2 text-[12px] leading-relaxed font-medium text-red-700">
          <Xmark width={14} height={14} className="mt-0.5 shrink-0" />
          Link reset tidak valid atau sudah kedaluwarsa. Silakan{" "}
          <Link href="/lupa-password" className="underline">
            Kirim link baru
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mb-3.5">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Kata Sandi Baru</label>
            <Input
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Konfirmasi Kata Sandi Baru
            </label>
            <Input
              type="password"
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
            />
          </div>

          {error && (
            <p className="mb-3.5 flex items-center gap-1 text-[11px] text-red-600">
              <Xmark width={14} height={14} />
              {error}
            </p>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Memproses..." : "Perbarui Kata Sandi"}
          </Button>
        </>
      )}
    </div>
  );
}
