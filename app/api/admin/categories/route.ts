import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// GET: List all categories with product counts
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(categories);
}

// POST: Create category
export async function POST(req: NextRequest) {
  const { name, parentId } = await req.json();
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 400 });

  const category = await prisma.category.create({
    data: { name, slug, parentId: parentId || null },
  });
  return NextResponse.json(category, { status: 201 });
}

// PATCH: Update category
export async function PATCH(req: NextRequest) {
  const { id, name, sortOrder, parentId } = await req.json();
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (name !== undefined) {
    update.name = name;
    update.slug = slugify(name);
  }
  if (sortOrder !== undefined) update.sortOrder = sortOrder;
  if (parentId !== undefined) update.parentId = parentId || null;

  const category = await prisma.category.update({ where: { id }, data: update });
  return NextResponse.json(category);
}

// DELETE: Delete category (only if no products)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json({ error: `No se puede eliminar: tiene ${count} productos` }, { status: 400 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
