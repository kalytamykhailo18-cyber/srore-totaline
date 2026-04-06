import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET: List all products for admin (including inactive)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  const showInactive = searchParams.get("inactive") === "1";

  const where: Record<string, unknown> = {};
  if (!showInactive) where.active = true;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { updatedAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      supplierPrice: Number(p.supplierPrice),
      resellerPrice: Number(p.resellerPrice),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST: Create manual product
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sku, name, description, resellerPrice, categoryId, imageUrl, stockStatus } = body;

  if (!sku || !name || !resellerPrice) {
    return NextResponse.json({ error: "SKU, nombre y precio son obligatorios" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un producto con ese SKU" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      sku,
      name,
      description: description || null,
      supplierPrice: resellerPrice,
      resellerPrice,
      categoryId: categoryId || null,
      imageUrl: imageUrl || null,
      stockStatus: stockStatus !== false,
      isManual: true,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

// PATCH: Update product
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.resellerPrice !== undefined) update.resellerPrice = data.resellerPrice;
  if (data.categoryId !== undefined) update.categoryId = data.categoryId || null;
  if (data.stockStatus !== undefined) update.stockStatus = data.stockStatus;
  if (data.active !== undefined) update.active = data.active;
  if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;

  const product = await prisma.product.update({
    where: { id },
    data: update,
  });

  return NextResponse.json(product);
}

// DELETE: Delete product
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
