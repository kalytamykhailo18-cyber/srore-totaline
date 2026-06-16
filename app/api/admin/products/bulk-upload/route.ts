import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const MARKUP = parseInt(process.env.MARKUP_PERCENTAGE || "50");

type RowResult = {
  sku: string;
  status: "updated" | "created" | "skipped";
  reason?: string;
  oldPrice?: number;
  newPrice?: number;
};

function findValue(row: Record<string, unknown>, candidates: string[]): string | null {
  const keys = Object.keys(row);
  for (const want of candidates) {
    const wantLow = want.toLowerCase().replace(/[\s_.-]/g, "");
    for (const k of keys) {
      const kLow = k.toLowerCase().replace(/[\s_.-]/g, "");
      if (kLow === wantLow || kLow.includes(wantLow)) {
        const v = row[k];
        if (v !== null && v !== undefined && String(v).trim() !== "") return String(v).trim();
      }
    }
  }
  return null;
}

function parseNumber(s: string): number {
  if (!s) return 0;
  const clean = s.replace(/\$/g, "").replace(/\s/g, "");
  if (clean.includes(",") && clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
    return parseFloat(clean.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return parseFloat(clean.replace(/,/g, "")) || 0;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "El Excel no tiene filas" }, { status: 400 });
    }

    const results: RowResult[] = [];
    let updated = 0, created = 0, skipped = 0;

    for (const row of rows) {
      const sku = findValue(row, ["sku", "codigo", "código", "code"]);
      const priceStr = findValue(row, ["precio", "price", "precio neto", "costo", "supplierprice"]);

      if (!sku) {
        results.push({ sku: "(sin sku)", status: "skipped", reason: "fila sin SKU" });
        skipped++;
        continue;
      }
      if (!priceStr) {
        results.push({ sku, status: "skipped", reason: "fila sin precio" });
        skipped++;
        continue;
      }
      const supplierPrice = parseNumber(priceStr);
      if (supplierPrice <= 0) {
        results.push({ sku, status: "skipped", reason: `precio inválido: ${priceStr}` });
        skipped++;
        continue;
      }

      const modelCode = findValue(row, ["modelo", "model", "modelcode", "fullsku"]);
      const name = findValue(row, ["nombre", "name", "descripcion", "descripción", "producto"]);
      const resellerPrice = Math.round(supplierPrice * (1 + MARKUP / 100));

      const existing = await prisma.product.findUnique({ where: { sku } });

      if (existing) {
        if (!dryRun) {
          await prisma.product.update({
            where: { sku },
            data: {
              supplierPrice,
              resellerPrice,
              ...(modelCode ? { modelCode } : {}),
              ...(name ? { name } : {}),
              lastSynced: new Date(),
            },
          });
        }
        results.push({
          sku, status: "updated",
          oldPrice: Number(existing.resellerPrice),
          newPrice: resellerPrice,
        });
        updated++;
      } else {
        if (!name) {
          results.push({ sku, status: "skipped", reason: "producto nuevo sin nombre" });
          skipped++;
          continue;
        }
        if (!dryRun) {
          await prisma.product.create({
            data: {
              sku, name,
              supplierPrice, resellerPrice,
              modelCode: modelCode || null,
              currency: "ARS",
              isManual: true,
            },
          });
        }
        results.push({ sku, status: "created", newPrice: resellerPrice });
        created++;
      }
    }

    return NextResponse.json({
      dryRun,
      markup: MARKUP,
      total: rows.length,
      updated, created, skipped,
      results,
    });
  } catch (e) {
    console.error("bulk-upload error:", e);
    return NextResponse.json({ error: "Error procesando el Excel: " + (e as Error).message }, { status: 500 });
  }
}
