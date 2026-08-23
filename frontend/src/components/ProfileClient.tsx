"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthToken, useAuthReady, getStoredInvestor, setAuthSession } from "@/lib/auth";
import { getProfile, updateProfile, updateProfilePassword } from "@/lib/api";
import type { ProfileData } from "@/lib/api";
import { Check, Xmark } from "iconoir-react";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/**
 * Halaman profil hanya bisa diakses oleh investor yang sudah login.
 */
export function ProfileClient() {
  const token = useAuthToken();
  const authReady = useAuthReady();
  const router = useRouter();

  useEffect(() => {
    if (authReady && token === null) {
      router.replace("/login?redirect=/profil");
    }
  }, [authReady, token, router]);

  if (!authReady) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
        Memeriksa sesi login...
      </div>
    );
  }

  if (!token) {
    /** authReady sudah true & token tetap null karena memang belum login, sedang diarahkan ke halaman login. */
    return null;
  }

  return <ProfileContent />;
}

function ProfileContent() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Form Informasi Akun ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  /**
   * Nilai awal nama & email saat data terakhir dimuat/disimpan dari API,
   * dipakai untuk menentukan apakah tombol "Simpan Perubahan" perlu aktif.
   */
  const [initialName, setInitialName] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const isAccountUnchanged = name === initialName && email === initialEmail;

  // --- Form Ganti Kata Sandi ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const isPasswordFormIncomplete = !currentPassword || !newPassword || !confirmNewPassword;

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getProfile();
        if (!ignore) {
          setProfile(data);
          setName(data.name);
          setEmail(data.email);
          setInitialName(data.name);
          setInitialEmail(data.email);
        }
      } catch (error) {
        if (!ignore) setLoadError(extractErrorMessage(error, "Gagal mengambil data profil."));
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSaveAccount() {
    if (!name.trim()) {
      setAccountError("Nama tidak boleh kosong.");
      return;
    }
    if (!email.trim()) {
      setAccountError("Email tidak boleh kosong.");
      return;
    }

    setAccountError(null);
    setAccountSuccess(null);
    setIsSavingAccount(true);
    try {
      const updated = await updateProfile({ name, email });
      setProfile(updated);
      setName(updated.name);
      setEmail(updated.email);
      setInitialName(updated.name);
      setInitialEmail(updated.email);
      setAccountSuccess("Perubahan berhasil disimpan.");

      /**
       * Nama/email yang tersimpan di localStorage (dipakai Navbar) ikut
       * diperbarui supaya tampilan "Halo, {nama}" langsung sinkron tanpa
       * perlu login ulang.
       */
      const stored = getStoredInvestor();
      const currentToken = localStorage.getItem("token");
      if (stored && currentToken) {
        setAuthSession(currentToken, {
          investor_id: updated.investor_id,
          name: updated.name,
          email: updated.email,
        });
      }
    } catch (error) {
      setAccountError(extractErrorMessage(error, "Gagal menyimpan perubahan."));
    } finally {
      setIsSavingAccount(false);
    }
  }

  async function handleUpdatePassword() {
    if (!currentPassword) {
      setPasswordError("Kata sandi saat ini wajib diisi.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setPasswordError(null);
    setPasswordSuccess(null);
    setIsSavingPassword(true);
    try {
      await updateProfilePassword({ currentPassword, newPassword });
      setPasswordSuccess("Kata sandi berhasil diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setPasswordError(extractErrorMessage(error, "Gagal memperbarui kata sandi."));
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="text-sm font-medium text-red-800">{loadError}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
        Memuat data profil...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[12px] text-muted-foreground">
        Bergabung sejak <strong className="font-semibold text-gray-700">{formatTanggal(profile.created_at)}</strong>
      </p>

      {/* Section 1 - Informasi Akun */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Informasi Akun</h2>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Nama</label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setAccountError(null);
              setAccountSuccess(null);
            }}
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setAccountError(null);
              setAccountSuccess(null);
            }}
          />
        </div>

        {accountError && (
          <p className="mb-3.5 flex items-center gap-1 text-[11px] text-red-600">
            <Xmark width={14} height={14} />
            {accountError}
          </p>
        )}
        {accountSuccess && (
          <p className="mb-3.5 flex items-center gap-1 text-[11px] font-medium text-green-700">
            <Check width={14} height={14} />
            {accountSuccess}
          </p>
        )}

        <Button onClick={handleSaveAccount} disabled={isSavingAccount || isAccountUnchanged}>
          {isSavingAccount ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {/* Section 2 - Ganti Kata Sandi */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Ganti Kata Sandi</h2>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Kata Sandi Saat Ini
          </label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setPasswordError(null);
              setPasswordSuccess(null);
            }}
          />
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Kata Sandi Baru
          </label>
          <Input
            type="password"
            placeholder="Minimal 8 karakter"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError(null);
              setPasswordSuccess(null);
            }}
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Konfirmasi Kata Sandi Baru
          </label>
          <Input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              setPasswordError(null);
              setPasswordSuccess(null);
            }}
          />
        </div>

        {passwordError && (
          <p className="mb-3.5 flex items-center gap-1 text-[11px] text-red-600">
            <Xmark width={14} height={14} />
            {passwordError}
          </p>
        )}
        {passwordSuccess && (
          <p className="mb-3.5 flex items-center gap-1 text-[11px] font-medium text-green-700">
            <Check width={14} height={14} />
            {passwordSuccess}
          </p>
        )}

        <Button onClick={handleUpdatePassword} disabled={isSavingPassword || isPasswordFormIncomplete}>
          {isSavingPassword ? "Memproses..." : "Perbarui Kata Sandi"}
        </Button>
      </div>
    </div>
  );
}
