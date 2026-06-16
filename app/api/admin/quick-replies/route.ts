import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

function requireAuth() {
  const c = cookies();
  return c.get("admin_session")?.value === "authenticated";
}

export async function GET() {
  if (!requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const replies = await prisma.quickReply.findMany({ orderBy: { shortcut: "asc" } });
  return NextResponse.json({ replies });
}

export async function POST(req: NextRequest) {
  if (!requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { shortcut, body } = await req.json();
  if (!shortcut || !body) return NextResponse.json({ error: "shortcut y body requeridos" }, { status: 400 });
  const reply = await prisma.quickReply.create({ data: { shortcut, body } });
  return NextResponse.json({ ok: true, reply });
}

export async function PUT(req: NextRequest) {
  if (!requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, shortcut, body } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await prisma.quickReply.update({ where: { id }, data: { shortcut, body } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await prisma.quickReply.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
