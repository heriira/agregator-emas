-- CreateTable
CREATE TABLE "WorldGoldPrice" (
    "id" SERIAL NOT NULL,
    "price_usd_oz" DECIMAL(65,30) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldGoldPrice_pkey" PRIMARY KEY ("id")
);
