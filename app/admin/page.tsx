"use client";
import { useState, useEffect } from "react";

interface SyncInfo {
  lastSync: {
    startedAt: string;
    finishedAt: string | null;
    productsTotal: number;
    productsAdded: number;
    productsUpdated: number;
    productsRemoved: number;
    errors: number;
  } | null;
  productCount: number;
  categoryCount: number;
}

export default function AdminDashboard() {
  const [info, setInfo] = useState<SyncInfo | null>(null);

  useEffect(() => {
    fetch("/api/sync").then((r) => r.json()).then(setInfo).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Administración</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Productos activos</p>
          <p className="text-3xl font-bold text-[#1e3a5f] mt-1">{info?.productCount ?? "..."}</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Categorías</p>
          <p className="text-3xl font-bold text-[#1e3a5f] mt-1">{info?.categoryCount ?? "..."}</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-500">Última sincronización</p>
          <p className="text-lg font-bold text-[#1e3a5f] mt-1">
            {info?.lastSync ? new Date(info.lastSync.startedAt).toLocaleString("es-AR") : "Nunca"}
          </p>
          {info?.lastSync && (
            <p className="text-xs text-gray-400 mt-1">
              +{info.lastSync.productsAdded} | ~{info.lastSync.productsUpdated} | -{info.lastSync.productsRemoved} | {info.lastSync.errors} errores
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/productos" className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow block">
          <h2 className="font-bold text-gray-800 mb-1">Productos</h2>
          <p className="text-sm text-gray-500">Gestionar productos, agregar manualmente, editar precios</p>
        </a>
        <a href="/admin/categorias" className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow block">
          <h2 className="font-bold text-gray-800 mb-1">Categorías</h2>
          <p className="text-sm text-gray-500">Organizar categorías, crear nuevas, editar orden</p>
        </a>
        <a href="/admin/sync" className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow block">
          <h2 className="font-bold text-gray-800 mb-1">Sincronización</h2>
          <p className="text-sm text-gray-500">Ejecutar sync con Totaline, ver historial</p>
        </a>
        <a href="/" className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow block">
          <h2 className="font-bold text-gray-800 mb-1">Ver Tienda</h2>
          <p className="text-sm text-gray-500">Ver la tienda como la ven los clientes</p>
        </a>
      </div>
    </div>
  );
}
