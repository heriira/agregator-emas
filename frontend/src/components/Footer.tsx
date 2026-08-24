export function Footer() {
  return (
    <footer className="mt-11 border-t border-border bg-card pt-5 pb-16 md:pb-5">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-2 px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary">
            <span className="text-[10px] font-bold text-gold">AE</span>
          </div>
          <span className="text-[13px] font-semibold text-foreground">Agregator Emas</span>
        </div>
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
