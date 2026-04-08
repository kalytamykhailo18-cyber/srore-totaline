import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

async function getUsdRate(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "usd_rate" } });
  return parseFloat(setting?.value || "1") || 1;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "24");
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = { active: true };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = parseInt(categoryId);

  const [products, total, usdRate] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
    getUsdRate(),
  ]);

  let hasUsd = false;
  const serialized = products.map((p) => {
    const isUsd = p.currency === "USD";
    if (isUsd) hasUsd = true;
    const reseller = Number(p.resellerPrice);
    return {
      ...p,
      supplierPrice: Number(p.supplierPrice),
      resellerPrice: isUsd ? Math.round(reseller * usdRate) : reseller,
      resellerPriceUsd: isUsd ? reseller : null,
      currency: p.currency,
    };
  });

  return NextResponse.json({
    products: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    usdRate,
    hasUsd,
  });
}
