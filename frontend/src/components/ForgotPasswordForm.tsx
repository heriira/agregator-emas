"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/lib/api";
import { Check, Xmark } from "iconoir-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !EMAIL_REGEX.test(email)) {
      setError("Masukkan email yang valid.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const message = await forgotPassword(email);
      setSuccessMessage(message);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengirim link reset. Coba lagi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-[20px] border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xl font-bold text-foreground">Lupa kata sandi?</p>
      <p className="mb-5 text-[13px] text-muted-foreground">
        Masukkan email akun Anda, kami akan mengirimkan link untuk membuat kata sandi baru.
      </p>

      {successMessage ? (
        <p className="mb-3.5 flex items-start gap-1.5 rounded-[8px] bg-green-50 px-2.5 py-2 text-[12px] leading-relaxed font-medium text-green-700">
          <Check width={14} height={14} className="mt-0.5 shrink-0" />
          {successMessage}
        </p>
      ) : (
        <>
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Email</label>
            <Input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
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
            {isSubmitting ? "Mengirim..." : "Kirim Link Reset"}
          </Button>
        </>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Ingat kata sandi?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
