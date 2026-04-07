import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET: Sync status (last sync info)
export async function GET() {
  const lastSync = await prisma.syncLog.findFirst({
    orderBy: { startedAt: "desc" },
  });

  const productCount = await prisma.product.count({ where: { active: true } });
  const categoryCount = await prisma.category.count();

  return NextResponse.json({ lastSync, productCount, categoryCount });
}

// POST: Trigger sync (runs scraper in background)
export async function POST() {
  const { exec } = await import("child_process");
  exec("cd /home/perez-refrigeracion && npx tsx scripts/scraper.ts >> /tmp/perez-scraper.log 2>&1 &");

  return NextResponse.json({ message: "Sincronización iniciada" });
}
