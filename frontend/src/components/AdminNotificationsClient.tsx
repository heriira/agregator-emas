"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { getAdminNotifications, exportAdminNotifications } from "@/lib/api";
import type { AdminNotificationItem } from "@/lib/api";
import { Download } from "iconoir-react";

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

export function AdminNotificationsClient() {
  const [notifications, setNotifications] = useState<AdminNotificationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getAdminNotifications();
        if (!ignore) setNotifications(data);
      } catch (err) {
        if (!ignore) setError(extractErrorMessage(err, "Gagal mengambil log notifikasi."));
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleExport() {
    setError(null);
    setIsExporting(true);
    try {
      await exportAdminNotifications();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengekspor log notifikasi."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[22px] font-bold tracking-tight text-foreground">
            Log Notifikasi
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Riwayat seluruh email notifikasi target harga yang pernah dicoba dikirim sistem.
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

      {!error && notifications === null && (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Memuat log notifikasi ...
        </div>
      )}

      {!error && notifications !== null && notifications.length === 0 && (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Belum ada notifikasi yang pernah dikirim.
        </div>
      )}

      {!error && notifications !== null && notifications.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Penyedia</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu Kirim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification, index) => (
                <TableRow key={notification.notificationId}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{notification.investor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.investor.email}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {notification.provider} ·{" "}
                    {notification.priceType === "beli" ? "Harga Beli" : "Harga Jual"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRupiah(notification.targetPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        notification.status === "sent"
                          ? "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                          : "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {notification.status === "sent" ? "Terkirim" : "Gagal"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(notification.sentAt)}
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
