"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminInvestors } from "@/lib/api";
import type { AdminInvestorItem } from "@/lib/api";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function AdminInvestorsClient() {
  const [investors, setInvestors] = useState<AdminInvestorItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getAdminInvestors();
        if (!ignore) setInvestors(data);
      } catch (err) {
        if (!ignore) setError(extractErrorMessage(err, "Gagal mengambil daftar investor."));
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-[22px] font-bold tracking-tight text-foreground">
          Pengguna Terdaftar
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Daftar seluruh investor yang mendaftar di Agregator Emas.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && investors === null && (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Memuat daftar investor...
        </div>
      )}

      {!error && investors !== null && investors.length === 0 && (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Belum ada investor yang mendaftar.
        </div>
      )}

      {!error && investors !== null && investors.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investors.map((investor, index) => (
                <TableRow key={investor.investor_id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {investor.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{investor.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(investor.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
