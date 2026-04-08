import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../../../../lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = parseInt(String(formData.get("productId") || "0"));

    if (!file || !productId) {
      return NextResponse.json({ error: "Archivo y producto requeridos" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Convert File → base64 data URL for Cloudinary upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "perez-refrigeracion",
      public_id: `manual-${product.sku}-${Date.now()}`,
      overwrite: true,
      resource_type: "image",
      transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
    });

    await prisma.product.update({
      where: { id: productId },
      data: { localImage: result.secure_url, imageUrl: result.secure_url },
    });

    return NextResponse.json({ ok: true, url: result.secure_url });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await prisma.product.update({
      where: { id: parseInt(productId) },
      data: { localImage: null, imageUrl: null },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
