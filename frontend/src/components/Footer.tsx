import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-11 border-t border-border bg-card pt-5 pb-16 md:pb-5">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-2 px-6">
        <Link href="/" className="mr-2 flex items-center gap-2">
          <Image
            src="/logo-agregator.svg"
            alt="Agregator Emas"
            width={160}
            height={32}
            className="object-contain"
          />
        </Link>
        {/* <p className="text-center text-[11px] text-muted-foreground">
          Data bersumber dari layanan API publik. Bukan merupakan saran investasi finansial.
        </p> */}
        <p className="text-[12px] text-muted-foreground">
          © {new Date().getFullYear()} Sistem Agregator Emas
        </p>
      </div>
    </footer>
  );
}
