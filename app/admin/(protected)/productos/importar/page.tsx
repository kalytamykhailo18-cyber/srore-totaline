"use client";
import { useState } from "react";
import Link from "next/link";

interface RowResult {
  sku: string;
  status: "updated" | "created" | "skipped";
  reason?: string;
  oldPrice?: number;
  newPrice?: number;
}
interface Response {
  dryRun: boolean;
  markup: number;
  total: number;
  updated: number;
  created: number;
  skipped: number;
  results: RowResult[];
}

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Response | null>(null);
  const [uploading, setUploading] = useState(false);
  const [committed, setCommitted] = useState<Response | null>(null);
  const [error, setError] = useState("");

  async function run(dryRun: boolean) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dryRun", String(dryRun));
      const res = await fetch("/api/admin/products/bulk-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error");
      } else {
        if (dryRun) {
          setPreview(data);
          setCommitted(null);
        } else {
          setCommitted(data);
          setPreview(null);
        }
      }
    } catch {
      setError("Error de red");
    }
    setUploading(false);
  }

  function fmt(n?: number) {
    return n ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n) : "—";
  }

  const result = committed || preview;
  const updates = result?.results.filter((r) => r.status === "updated") || [];
  const creates = result?.results.filter((r) => r.status === "created") || [];
  const skips = result?.results.filter((r) => r.status === "skipped") || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Importar precios desde Excel</h1>
        <Link href="/admin/productos" className="text-sm text-brand-700 hover:underline">← Volver a Productos</Link>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold text-gray-700 mb-2">Cómo armar el Excel</h2>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Una fila por producto. La primera fila son los nombres de columna.</li>
          <li>Columnas obligatorias: <b>SKU</b> y <b>Precio</b> (acepta también nombres &quot;Código&quot;, &quot;Precio neto&quot;, &quot;Costo&quot;).</li>
          <li>Columnas opcionales: <b>Nombre</b> (obligatoria si el SKU no existe), <b>Modelo</b> (código tipo FLEX-FLE065B54A).</li>
          <li>El precio del Excel es el de Totaline (sin IVA). El sistema le suma el markup configurado y guarda el precio final.</li>
          <li>Markup actual configurado: <b className="text-emerald-700">{preview?.markup ?? committed?.markup ?? "50"}%</b></li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6 space-y-3">
        <label className="block text-sm font-medium text-gray-700">Archivo Excel (.xlsx, .xls, .csv)</label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); setCommitted(null); }}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
        />
        <div className="flex gap-2">
          <button
            onClick={() => run(true)}
            disabled={!file || uploading}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {uploading ? "Procesando..." : "Previsualizar"}
          </button>
          {preview && (
            <button
              onClick={() => run(false)}
              disabled={uploading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {uploading ? "Aplicando..." : "Aplicar cambios"}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {committed && (
          <p className="text-sm text-emerald-700 font-medium">
            ✓ Listo. Se aplicaron {committed.updated} actualizaciones y {committed.created} altas.
          </p>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[120px]">
              <div className="text-xs text-gray-500">Total filas</div>
              <div className="text-xl font-bold text-gray-800">{result.total}</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 flex-1 min-w-[120px]">
              <div className="text-xs text-emerald-700">Actualizados</div>
              <div className="text-xl font-bold text-emerald-700">{result.updated}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 flex-1 min-w-[120px]">
              <div className="text-xs text-blue-700">Nuevos</div>
              <div className="text-xl font-bold text-blue-700">{result.created}</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 flex-1 min-w-[120px]">
              <div className="text-xs text-amber-700">Salteados</div>
              <div className="text-xl font-bold text-amber-700">{result.skipped}</div>
            </div>
          </div>

          {updates.length > 0 && (
            <details open>
              <summary className="font-semibold text-emerald-700 cursor-pointer">Actualizaciones ({updates.length})</summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-right px-3 py-2">Precio anterior</th>
                      <th className="text-right px-3 py-2">Precio nuevo</th>
                      <th className="text-right px-3 py-2">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {updates.slice(0, 100).map((r) => {
                      const diff = (r.newPrice || 0) - (r.oldPrice || 0);
                      return (
                        <tr key={r.sku}>
                          <td className="px-3 py-1.5 font-mono text-xs">{r.sku}</td>
                          <td className="px-3 py-1.5 text-right">{fmt(r.oldPrice)}</td>
                          <td className="px-3 py-1.5 text-right font-medium">{fmt(r.newPrice)}</td>
                          <td className={`px-3 py-1.5 text-right ${diff > 0 ? "text-red-600" : diff < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                            {diff > 0 ? "+" : ""}{fmt(diff)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {updates.length > 100 && <p className="text-xs text-gray-500 mt-2">Mostrando 100 de {updates.length}</p>}
              </div>
            </details>
          )}

          {creates.length > 0 && (
            <details>
              <summary className="font-semibold text-blue-700 cursor-pointer">Productos nuevos ({creates.length})</summary>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {creates.slice(0, 50).map((r) => (
                  <li key={r.sku}><span className="font-mono text-xs">{r.sku}</span> — {fmt(r.newPrice)}</li>
                ))}
                {creates.length > 50 && <li className="text-xs text-gray-500">… y {creates.length - 50} más</li>}
              </ul>
            </details>
          )}

          {skips.length > 0 && (
            <details>
              <summary className="font-semibold text-amber-700 cursor-pointer">Salteados ({skips.length})</summary>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {skips.slice(0, 50).map((r, i) => (
                  <li key={i}><span className="font-mono text-xs">{r.sku}</span> — {r.reason}</li>
                ))}
                {skips.length > 50 && <li className="text-xs text-gray-500">… y {skips.length - 50} más</li>}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
