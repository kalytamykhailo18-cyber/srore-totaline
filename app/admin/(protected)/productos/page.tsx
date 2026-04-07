"use client";
import { useState, useEffect, useCallback } from "react";

interface Product {
  id: number;
  sku: string;
  name: string;
  supplierPrice: number;
  resellerPrice: number;
  stockStatus: boolean;
  active: boolean;
  isManual: boolean;
  category: { id: number; name: string } | null;
  lastSynced: string | null;
}

interface Category {
  id: number;
  name: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ sku: "", name: "", description: "", resellerPrice: "", categoryId: "", stockStatus: true });
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", String(page));
    if (showInactive) params.set("inactive", "1");

    fetch(`/api/admin/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page, showInactive]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!formData.sku || !formData.name || !formData.resellerPrice) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          resellerPrice: parseFloat(formData.resellerPrice),
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      setFormData({ sku: "", name: "", description: "", resellerPrice: "", categoryId: "", stockStatus: true });
      setShowForm(false);
      fetchProducts();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: Product) => {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, active: !product.active }),
    });
    fetchProducts();
  };

  const formatPrice = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos ({total})</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? "Cancelar" : "+ Agregar producto manual"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-4 mb-6 space-y-3">
          <h2 className="font-bold text-gray-700">Nuevo producto manual</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="SKU *" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Nombre *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Precio *" type="number" value={formData.resellerPrice} onChange={(e) => setFormData({ ...formData, resellerPrice: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Descripción" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? "Guardando..." : "Crear producto"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Inactivos
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Costo</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay productos</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className={`border-b hover:bg-gray-50 ${!p.active ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category?.name || "-"}</td>
                <td className="px-4 py-3 text-right text-gray-400">{formatPrice(p.supplierPrice)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(p.resellerPrice)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`w-2 h-2 rounded-full inline-block ${p.stockStatus ? "bg-green-500" : "bg-red-500"}`} />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isManual ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                    {p.isManual ? "Manual" : "Totaline"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p)} className={`text-xs ${p.active ? "text-red-500" : "text-green-500"} hover:underline`}>
                    {p.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border text-sm bg-white disabled:opacity-40">
            Anterior
          </button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border text-sm bg-white disabled:opacity-40">
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
