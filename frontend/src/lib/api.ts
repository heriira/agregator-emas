import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isAdminRequest = config.url?.startsWith("/admin");
    const token = localStorage.getItem(isAdminRequest ? "adminToken" : "token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;

/**
 * Struktur data respons GET /prices dari backend (lihat backend/src/routes/prices.ts).
 */
export interface GoldPriceItem {
  source: string;
  displayName: string;
  type: "fisik" | "digital";
  logo: string | null;
  urlHomepage: string | null;
  sellPrice: number;
  buybackPrice: number | null;
  recordedDate: string;
  fetchedAt: string;
  lastCheckedAt: string | null;
}

interface GoldPricesResponse {
  success: boolean;
  data: GoldPriceItem[];
  timestamp: string;
}

/**
 * Mengambil harga emas terbaru dari semua penyedia yang visible (fisik & digital sekaligus.
 * Setiap panggilan endpoint ini men-trigger scraping + pengecekan notifikasi di backend jadi datanya selalu representasi harga terbaru yang backend berhasil ambil.
 */
export async function getPrices(): Promise<GoldPriceItem[]> {
  const { data } = await api.get<GoldPricesResponse>("/prices");
  return data.data;
}

/**
 * Bentuk respons GET /prices/:source/history (related dengan backend/src/routes/prices.ts).
 */
export interface PriceHistoryPoint {
  recordedDate: string;
  sellPrice: number;
  buybackPrice: number | null;
}

export interface PriceHistory {
  source: string;
  displayName: string;
  history: PriceHistoryPoint[];
}

interface PriceHistoryResponse {
  success: boolean;
  data: PriceHistory;
}

/**
 * Mengambil riwayat harga satu penyedia (maks 30 hari terakhir), dan ditampilakan kedalam popup "Riwayat" di GoldCard.
 */
export async function getPriceHistory(source: string): Promise<PriceHistory> {
  const { data } = await api.get<PriceHistoryResponse>(`/prices/${source}/history`);
  return data.data;
}

/**
 * Bentuk respons GET /world-price (related backend/src/routes/worldPrice.ts).
 */
export interface WorldGoldPrice {
  priceUsdPerOz: number;
  changePercent: number | null;
  pricePerGramIdr: number | null;
  history: { recordedAt: string; priceUsdPerOz: number }[];
}

interface WorldGoldPriceResponse {
  success: boolean;
  data: WorldGoldPrice | null;
}

/**
 * Mengambil indikator harga emas dunia (XAU/USD). Mengembalikan `null` kalau backend belum sempat menyimpan snapshot apa pun (contoh ketika baru pertama kali dijalankan) 
 */
export async function getWorldGoldPrice(): Promise<WorldGoldPrice | null> {
  const { data } = await api.get<WorldGoldPriceResponse>("/world-price");
  return data.data;
}

/**
 * Bentuk satu item respons endpoint /alerts (related backend/src/routes/alerts.ts).
 */
export interface PriceAlertItem {
  alertId: number;
  provider: {
    source: string;
    displayName: string;
    type: "fisik" | "digital";
    logo: string | null;
  };
  priceType: "beli" | "jual";
  targetPrice: number;
  condition: "gte" | "lte";
  status: "aktif" | "selesai";
  createdAt: string;
}

interface AlertsResponse {
  success: boolean;
  data: PriceAlertItem[];
}

interface AlertResponse {
  success: boolean;
  message: string;
  data: PriceAlertItem;
}

/**
 * Mengambil daftar target notifikasi milik investor yang SEDANG LOGIN. Kalau token tidak ada/tidak valid, backend akan memberikan respon error
 */
export async function getAlerts(status?: "aktif" | "selesai"): Promise<PriceAlertItem[]> {
  const { data } = await api.get<AlertsResponse>("/alerts", {
    params: status ? { status } : undefined,
  });
  return data.data;
}

export interface CreateAlertInput {
  providerSource: string;
  targetPrice: number;
  priceType: "beli" | "jual";
}

export async function createAlert(input: CreateAlertInput): Promise<PriceAlertItem> {
  const { data } = await api.post<AlertResponse>("/alerts", input);
  return data.data;
}

export async function deleteAlert(alertId: number): Promise<void> {
  await api.delete(`/alerts/${alertId}`);
}

/**
 * Bentuk respons POST /auth/login (related backend/src/routes/auth.ts).
 */
export interface LoginResult {
  token: string;
  investor: { investor_id: number; name: string; email: string };
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginResult;
}

export async function login(input: { email: string; password: string }): Promise<LoginResult> {
  const { data } = await api.post<LoginResponse>("/auth/login", input);
  return data.data;
}

/**
 * Bentuk respons POST /auth/register (related backend/src/routes/auth.ts).
 */
export interface RegisterResult {
  investor_id: number;
  name: string;
  email: string;
  created_at: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: RegisterResult;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const { data } = await api.post<RegisterResponse>("/auth/register", input);
  return data.data;
}

/**
 * Endpoint panel admin (related backend/src/routes/admin.ts)
 */

export interface AdminLoginResult {
  token: string;
  admin: { admin_id: number; name: string; email: string };
}

interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: AdminLoginResult;
}

export async function adminLogin(input: {
  email: string;
  password: string;
}): Promise<AdminLoginResult> {
  const { data } = await api.post<AdminLoginResponse>("/admin/login", input);
  return data.data;
}

/**
 * Bentuk respon item respons GET /admin/providers
 */
export interface AdminProviderItem {
  providerId: number;
  source: string;
  displayName: string;
  type: "fisik" | "digital";
  status: "visible" | "hidden";
  logo: string | null;
  urlHomepage: string | null;
  updatedAt: string;
  lastFetchedAt: string | null;
}

interface AdminProvidersResponse {
  success: boolean;
  data: AdminProviderItem[];
}

export async function getAdminProviders(): Promise<AdminProviderItem[]> {
  const { data } = await api.get<AdminProvidersResponse>("/admin/providers");
  return data.data;
}

/** 
 * Mengubah visibilitas suatu provider 
 */ 
export async function updateProviderVisibility(
  providerId: number,
  status: "visible" | "hidden"
): Promise<void> {
  await api.patch(`/admin/providers/${providerId}/visibility`, { status });
}

export interface AdminInvestorItem {
  investor_id: number;
  name: string;
  email: string;
  created_at: string;
}

interface AdminInvestorsResponse {
  success: boolean;
  data: AdminInvestorItem[];
}

export async function getAdminInvestors(): Promise<AdminInvestorItem[]> {
  const { data } = await api.get<AdminInvestorsResponse>("/admin/investors");
  return data.data;
}

export interface AdminNotificationItem {
  notificationId: number;
  investor: { name: string; email: string };
  provider: string;
  priceType: "beli" | "jual";
  targetPrice: number;
  status: "sent" | "failed";
  sentAt: string;
}

interface AdminNotificationsResponse {
  success: boolean;
  data: AdminNotificationItem[];
}

export async function getAdminNotifications(): Promise<AdminNotificationItem[]> {
  const { data } = await api.get<AdminNotificationsResponse>("/admin/notifications");
  return data.data;
}
