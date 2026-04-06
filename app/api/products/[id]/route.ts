import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(params.id) },
    include: { category: true },
  });

  if (!product || !product.active) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...product,
    supplierPrice: Number(product.supplierPrice),
    resellerPrice: Number(product.resellerPrice),
  });
}
