-- CreateTable
CREATE TABLE "Investor" (
    "investor_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("investor_id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "admin_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "GoldProvider" (
    "provider_id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "logo" TEXT,
    "url_homepage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "GoldProvider_pkey" PRIMARY KEY ("provider_id")
);

-- CreateTable
CREATE TABLE "GoldPrice" (
    "price_id" SERIAL NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "sell_price" DECIMAL(65,30) NOT NULL,
    "buyback_price" DECIMAL(65,30) NOT NULL,
    "recorded_date" TIMESTAMP(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoldPrice_pkey" PRIMARY KEY ("price_id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "alert_id" SERIAL NOT NULL,
    "investor_id" INTEGER NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "target_price" DECIMAL(65,30) NOT NULL,
    "price_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("alert_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" SERIAL NOT NULL,
    "investor_id" INTEGER NOT NULL,
    "alert_id" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Investor_email_key" ON "Investor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GoldProvider_source_key" ON "GoldProvider"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_alert_id_key" ON "Notification"("alert_id");

-- AddForeignKey
ALTER TABLE "GoldPrice" ADD CONSTRAINT "GoldPrice_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "GoldProvider"("provider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "Investor"("investor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "GoldProvider"("provider_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "Investor"("investor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "PriceAlert"("alert_id") ON DELETE RESTRICT ON UPDATE CASCADE;
