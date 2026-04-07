/**
 * Fetch BNA dollar rate and store in settings table.
 * Run on cron daily.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
  if (!res.ok) {
    console.error("Failed to fetch USD rate:", res.status);
    process.exit(1);
  }
  const data = await res.json();
  const venta = data.venta;
  if (!venta || typeof venta !== "number") {
    console.error("Invalid response:", data);
    process.exit(1);
  }

  await prisma.setting.upsert({
    where: { key: "usd_rate" },
    update: { value: String(venta) },
    create: { key: "usd_rate", value: String(venta) },
  });
  await prisma.setting.upsert({
    where: { key: "usd_rate_updated" },
    update: { value: new Date().toISOString() },
    create: { key: "usd_rate_updated", value: new Date().toISOString() },
  });

  console.log(`USD rate updated: ARS ${venta} (BNA oficial venta)`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
