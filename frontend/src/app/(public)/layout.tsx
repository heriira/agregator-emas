import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";

/**
 * Route group (public) nama folder pakai tanda kurung supaya TIDAK muncul di URL (mis. halaman ini tetap di "/", bukan "/public").
 */
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col pb-20 md:pb-0">{children}</div>
      <Footer />
      <BottomNav />
    </div>
  );
}
