import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

function requireAuth() {
  const c = cookies();
  return c.get("admin_session")?.value === "authenticated";
}

const UPLOAD_DIR = "/home/perez-refrigeracion/public/uploads/inbox";
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "video/mp4": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/mp4": "audio",
  "audio/ogg": "audio",
  "audio/webm": "audio",
  "application/pdf": "document",
};

export async function POST(req: NextRequest) {
  if (!requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // Validate
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Archivo muy grande (max 20MB)" }, { status: 400 });
    }
    const mediaType = ALLOWED_TYPES[file.type];
    if (!mediaType) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    // Save to disk
    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/inbox/${filename}`;

    return NextResponse.json({ ok: true, url, mediaType, filename });
  } catch (error) {
    return NextResponse.json({ error: "Error uploading" }, { status: 500 });
  }
}
