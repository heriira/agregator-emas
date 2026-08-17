import { AdminShell } from "@/components/AdminShell";

/**
 * Layout admin tidak menggunakan Navbar/Footer dari situs publik (app/(public)/layout.tsx). 
 * Admin memiliki chrome/layout sendiri berupa sidebar yang dipasang melalui AdminShell. 
 * Selain itu, AdminShell juga berfungsi sebagai gerbang autentikasi untuk seluruh halaman di bawah route /admin
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
