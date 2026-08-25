"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
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
import { getAdminInvestors, updateInvestorStatus, exportAdminInvestors } from "@/lib/api";
import type { AdminInvestorItem } from "@/lib/api";
import { Download } from "iconoir-react";

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

const PAGE_SIZE = 10;

export function AdminInvestorsClient() {
  const [investors, setInvestors] = useState<AdminInvestorItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminInvestorItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);

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

  async function applyStatusChange(investor: AdminInvestorItem, status: "aktif" | "nonaktif") {
    setActionError(null);
    setUpdatingId(investor.investor_id);
    try {
      const updated = await updateInvestorStatus(investor.investor_id, status);
      setInvestors((prev) =>
        prev
          ? prev.map((item) => (item.investor_id === updated.investor_id ? updated : item))
          : prev
      );
    } catch (err) {
      setActionError(extractErrorMessage(err, "Gagal mengubah status investor."));
    } finally {
      setUpdatingId(null);
      setConfirmTarget(null);
    }
  }

  function handleToggleStatus(investor: AdminInvestorItem) {
    if (investor.status === "aktif") {
      /** Menonaktifkan butuh konfirmasi karena berdampak langsung ke akses login investor. */
      setConfirmTarget(investor);
    } else {
      /** Mengaktifkan kembali tidak butuh konfirmasi. */
      applyStatusChange(investor, "aktif");
    }
  }

  const paginated = useMemo(
    () => (investors ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [investors, page]
  );

  async function handleExport() {
    setActionError(null);
    setIsExporting(true);
    try {
      await exportAdminInvestors();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Gagal mengekspor data investor."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[22px] font-bold tracking-tight text-foreground">
            Pengguna Terdaftar
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Daftar seluruh investor yang mendaftar di Agregator Emas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
          <Download width={16} height={16} />
          {isExporting ? "Mengekspor..." : "Export Excel"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
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
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((investor, index) => (
                <TableRow key={investor.investor_id}>
                  <TableCell className="text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {investor.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{investor.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        investor.status === "aktif"
                          ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                          : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {investor.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(investor.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingId === investor.investor_id}
                      onClick={() => handleToggleStatus(investor)}
                    >
                      {updatingId === investor.investor_id
                        ? "Memproses..."
                        : investor.status === "aktif"
                          ? "Nonaktifkan"
                          : "Aktifkan"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={page}
            totalItems={investors.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan {confirmTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengguna ini tidak akan dapat masuk ke sistem setelah dinonaktifkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingId !== null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmTarget && applyStatusChange(confirmTarget, "nonaktif")}
              disabled={updatingId !== null}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {updatingId !== null ? "Memproses..." : "Nonaktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
