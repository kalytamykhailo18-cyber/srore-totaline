import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

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

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const serialized = products.map((p) => ({
    ...p,
    supplierPrice: Number(p.supplierPrice),
    resellerPrice: Number(p.resellerPrice),
  }));

  return NextResponse.json({
    products: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
