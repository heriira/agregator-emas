"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLogin } from "@/lib/api";
import { setAdminSession } from "@/lib/auth";
import { Xmark } from "iconoir-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email || !EMAIL_REGEX.test(email)) {
      setError("Masukkan email yang valid.");
      return;
    }
    if (!password) {
      setError("Kata sandi wajib diisi.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const result = await adminLogin({ email, password });
      setAdminSession(result.token, result.admin);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal masuk. Coba lagi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[380px] rounded-[20px] border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-primary">
          <span className="text-sm font-bold text-gold">AE</span>
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-foreground">Agregator Emas</p>
          <p className="text-[11px] text-muted-foreground">Dashboard Admin</p>
        </div>
      </div>

      <p className="mb-1 text-xl font-bold text-foreground">Masuk sebagai Admin</p>
      <p className="mb-5 text-[13px] text-muted-foreground">
        Khusus untuk pengelola sistem Agregator Emas.
      </p>

      <div className="mb-3.5">
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Email</label>
        <Input
          type="email"
          placeholder="admin@agregatoremas.id"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
        />
      </div>

      <div className="mb-5">
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Kata Sandi</label>
        <Input
          type="password"
          placeholder="Masukkan kata sandi"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
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
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </div>
  );
}
