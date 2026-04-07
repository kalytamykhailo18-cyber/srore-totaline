"use client";
import { useState, useEffect } from "react";

interface SyncLog {
  id: number;
  type: string;
  startedAt: string;
  finishedAt: string | null;
  productsTotal: number;
  productsAdded: number;
  productsUpdated: number;
  productsRemoved: number;
  errors: number;
}

export default function AdminSync() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    fetch("/api/admin/sync")
      .then((r) => r.json())
      .then((data) => {
        if (data.lastSync) setLogs([data.lastSync]);
      })
      .catch(() => {});
  };

  const handleSync = async () => {
    if (!confirm("¿Iniciar la sincronización con Totaline? Puede tardar varios minutos.")) return;
    setSyncing(true);
    setStatus("Iniciando sincronización...");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setStatus(`Error: ${err.error}`);
        return;
      }
      setStatus("Sincronización iniciada. El proceso puede tardar varios minutos. Recargá la página para ver el resultado.");
    } catch {
      setStatus("Error al iniciar la sincronización");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sincronización con Totaline</h1>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <p className="text-gray-600 mb-4">
          La sincronización descarga todos los productos de <strong>store.totaline.ar</strong>, aplica el markup del 50% y actualiza la base de datos.
          Los productos que ya no estén en Totaline se desactivan automáticamente.
        </p>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary disabled:opacity-50"
        >
          {syncing ? "Sincronizando..." : "Ejecutar sincronización ahora"}
        </button>

        {status && (
          <p className={`mt-3 text-sm ${status.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
            {status}
          </p>
        )}
      </div>

      <h2 className="text-lg font-bold text-gray-700 mb-4">Historial</h2>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Agregados</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Actualizados</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Removidos</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Errores</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay registros de sincronización</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="px-4 py-3">{new Date(log.startedAt).toLocaleString("es-AR")}</td>
                <td className="px-4 py-3 text-center">{log.productsTotal}</td>
                <td className="px-4 py-3 text-center text-green-600">+{log.productsAdded}</td>
                <td className="px-4 py-3 text-center text-blue-600">~{log.productsUpdated}</td>
                <td className="px-4 py-3 text-center text-red-600">-{log.productsRemoved}</td>
                <td className="px-4 py-3 text-center">{log.errors}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.finishedAt ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                    {log.finishedAt ? "Completado" : "En curso"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
