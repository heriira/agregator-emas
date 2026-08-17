import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/**
 * Route group (public) nama folder pakai tanda kurung supaya TIDAK muncul di URL (mis. halaman ini tetap di "/", bukan "/public").
 */
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
