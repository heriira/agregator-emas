import { Commodity, DollarCircle, LineSpace } from "iconoir-react";

const TOPICS = [
  {
    icon: LineSpace,
    title: "Apa itu Spread?",
    description:
      "Spread adalah selisih antara harga beli dan harga jual emas. Semakin kecil spread, semakin menguntungkan bagi investor.",
  },
  {
    icon: Commodity,
    title: "Emas Fisik vs Digital",
    description:
      "Emas fisik berbentuk logam mulia bersertifikat. Emas digital tersimpan secara elektronik dan bisa dibeli mulai dari 0,01 gram.",
  },
  {
    icon: DollarCircle,
    title: "XAU/USD",
    description:
      "Harga emas dunia dalam USD per troy ounce. Pergerakan XAU/USD berpengaruh langsung terhadap harga emas di Indonesia.",
  },
];

export function EducationSection() {
  return (
    <div className="mt-11 border-t border-border pt-7">
      <h2 className="mb-1 text-[15px] font-bold text-foreground">
        Pahami Investasi Emas
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Sebelum berinvestasi, kenali perbedaan antara emas fisik dan emas digital.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TOPICS.map((topic) => (
          <div
            key={topic.title}
            className="rounded-xl border border-border bg-card p-4"
          >
            <topic.icon className="mb-2 text-foreground" width={32} height={32} />
            <h3 className="mb-1 text-xs font-semibold text-foreground">
              {topic.title}
            </h3>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {topic.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
