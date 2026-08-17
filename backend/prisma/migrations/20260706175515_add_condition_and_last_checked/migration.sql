-- AlterTable
ALTER TABLE "GoldProvider" ADD COLUMN     "last_checked_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PriceAlert" ADD COLUMN     "condition" TEXT NOT NULL DEFAULT 'gte';
