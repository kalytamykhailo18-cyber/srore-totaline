import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [product, rateSetting] = await Promise.all([
    prisma.product.findUnique({
      where: { id: parseInt(params.id) },
      include: { category: true },
    }),
    prisma.setting.findUnique({ where: { key: "usd_rate" } }),
  ]);

  if (!product || !product.active) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const usdRate = parseFloat(rateSetting?.value || "1") || 1;
  const isUsd = product.currency === "USD";
  const reseller = Number(product.resellerPrice);

  return NextResponse.json({
    ...product,
    supplierPrice: Number(product.supplierPrice),
    resellerPrice: isUsd ? Math.round(reseller * usdRate) : reseller,
    resellerPriceUsd: isUsd ? reseller : null,
    usdRate,
  });
}
