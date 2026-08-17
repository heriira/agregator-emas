import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";

/* Import API end point */
import pricesRouter from "./routes/prices";
import authRouter from "./routes/auth";
import alertsRouter from "./routes/alerts";
import adminRouter from "./routes/admin";
import worldPriceRouter from "./routes/worldPrice";
import { cleanupOldPrices } from "./services/scraper";
import { cleanupOldWorldGoldPrices } from "./services/worldGoldPrice";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/hi", (_req, res) => {
  res.json({ success: true, message: "Agregator Emas API is running" });
});

app.use("/prices", pricesRouter);
app.use("/auth", authRouter);
app.use("/alerts", alertsRouter);
app.use("/admin", adminRouter);
app.use("/world-price", worldPriceRouter);

/* (0 3 * * *) merupakan cron yang berjalan setiap hari pukul 03:00 untuk menghapus data harga yang sudah melewati 30 hari */
cron.schedule("0 3 * * *", () => {
  cleanupOldPrices();
  cleanupOldWorldGoldPrices();
});

/* Proses cleanup juga dijalankan sekali ketika server pertama kali menyala agar tidak perlu menunggu jam 03:00 */
cleanupOldPrices();
cleanupOldWorldGoldPrices();

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
