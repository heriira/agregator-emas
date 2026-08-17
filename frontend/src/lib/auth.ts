/**
 * Helper sesi login investor di sisi client (localStorage).
 */
import { useSyncExternalStore } from "react";

const TOKEN_KEY = "token";
const INVESTOR_KEY = "investor";
const AUTH_CHANGE_EVENT = "emasinfo-auth-change";

export interface StoredInvestor {
  investor_id: number;
  name: string;
  email: string;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredInvestor(): StoredInvestor | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(INVESTOR_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredInvestor;
  } catch {
    return null;
  }
}

/** 
 * Dipanggil setelah login/register berhasil (related dengan components/AuthForm.tsx). 
 * */
export function setAuthSession(token: string, investor: StoredInvestor): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(INVESTOR_KEY, JSON.stringify(investor));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(INVESTOR_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function subscribeToken(callback: () => void) {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, callback);
}

function getServerTokenSnapshot() {
  return null;
}

/** Digunakan untuk komponen client mana pun yang perlu tahu status login investor. Seperti Navbar (tampilkan nama vs tombol Masuk/Daftar) dan NotifikasiClient
*/
export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribeToken, getStoredToken, getServerTokenSnapshot);
}

/**
 * Helper sesi login investor di sisi client (localStorage).
 */
const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_KEY = "adminInfo";
const ADMIN_AUTH_CHANGE_EVENT = "emasinfo-admin-auth-change";

export interface StoredAdmin {
  admin_id: number;
  name: string;
  email: string;
}

export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getStoredAdmin(): StoredAdmin | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAdmin;
  } catch {
    return null;
  }
}

export function setAdminSession(token: string, admin: StoredAdmin): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

function subscribeAdminToken(callback: () => void) {
  window.addEventListener(ADMIN_AUTH_CHANGE_EVENT, callback);
  return () => window.removeEventListener(ADMIN_AUTH_CHANGE_EVENT, callback);
}

/**
 *  Dipakai oleh app/admin/layout.tsx untuk gerbang auth panel admin. 
 * */
export function useAdminToken(): string | null {
  return useSyncExternalStore(subscribeAdminToken, getStoredAdminToken, getServerTokenSnapshot);
}
