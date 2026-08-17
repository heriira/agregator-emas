const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const providers = [
    { source: 'antam', display_name: 'Antam', type: 'fisik', logo: '/logos/antam.png', url_homepage: 'https://www.logammulia.com' },
    { source: 'ubs', display_name: 'UBS', type: 'fisik', logo: '/logos/ubs.png', url_homepage: 'https://www.ubs-gold.com' },
    { source: 'galeri24', display_name: 'Galeri24', type: 'fisik', logo: '/logos/galery24.png', url_homepage: 'https://galeri24.co.id' },
    { source: 'lotus-archi', display_name: 'Lotus Archi', type: 'fisik', logo: '/logos/lotus-archi.png', url_homepage: 'https://www.lotusarchi.com' },
    { source: 'emasku', display_name: 'Emasku', type: 'fisik', logo: '/logos/emasku.png', url_homepage: 'https://www.emasku.co.id' },
    { source: 'treasury', display_name: 'Treasury', type: 'digital', logo: '/logos/treasury.png', url_homepage: 'https://treasury.id' },
    { source: 'pegadaian', display_name: 'Pegadaian Digital', type: 'digital', logo: '/logos/pegadaian.png', url_homepage: 'https://sahabat.pegadaian.co.id' },
    { source: 'cermati', display_name: 'Cermati', type: 'digital', logo: '/logos/cermati.png', url_homepage: 'https://www.cermati.com' },
    { source: 'lakuemas', display_name: 'Laku Emas', type: 'digital', logo: '/logos/lakuemas.png', url_homepage: 'https://www.lakuemas.com' },
    { source: 'indogold', display_name: 'Indogold', type: 'digital', logo: '/logos/indogold.png', url_homepage: 'https://www.indogold.id' },
  ];

  for (const p of providers) {
    await prisma.goldProvider.upsert({
      where: { source: p.source },
      update: p,
      create: p,
    });
  }
  console.log(`Seed selesai — ${providers.length} penyedia berhasil ditambahkan/diperbarui.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
