"use client";
import { useState, useEffect, useCallback } from "react";

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  supplierPrice: number;
  resellerPrice: number;
  currency: string;
  stockStatus: boolean;
  active: boolean;
  isManual: boolean;
  localImage: string | null;
  imageUrl: string | null;
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
  const [formData, setFormData] = useState({ sku: "", name: "", description: "", resellerPrice: "", categoryId: "", stockStatus: true, currency: "ARS" });
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", resellerPrice: "", categoryId: "", currency: "ARS", stockStatus: true });
  const [editSaving, setEditSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [editImage, setEditImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products?limit=1")
      .then((r) => r.json())
      .then((d) => setUsdRate(d.usdRate || null))
      .catch(() => {});
  }, []);
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
      setFormData({ sku: "", name: "", description: "", resellerPrice: "", categoryId: "", stockStatus: true, currency: "ARS" });
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

  const openEdit = (product: Product) => {
    setEditing(product);
    setEditForm({
      name: product.name,
      description: product.description || "",
      resellerPrice: String(product.resellerPrice),
      categoryId: product.category?.id ? String(product.category.id) : "",
      currency: product.currency || "ARS",
      stockStatus: product.stockStatus,
    });
    setEditImage(product.localImage || product.imageUrl || null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede pesar más de 5 MB");
      return;
    }
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", String(editing.id));
      const res = await fetch("/api/admin/products/upload-image", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error al subir imagen");
        return;
      }
      const data = await res.json();
      setEditImage(data.url);
      fetchProducts();
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  };

  const handleImageDelete = async () => {
    if (!editing) return;
    if (!confirm("¿Quitar la imagen de este producto?")) return;
    await fetch("/api/admin/products/upload-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: editing.id }),
    });
    setEditImage(null);
    fetchProducts();
  };

  const handleEditSave = async () => {
    if (!editing) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editForm.name,
          description: editForm.description,
          resellerPrice: parseFloat(editForm.resellerPrice) || 0,
          categoryId: editForm.categoryId ? parseInt(editForm.categoryId) : null,
          currency: editForm.currency,
          stockStatus: editForm.stockStatus,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error al guardar");
        return;
      }
      setEditing(null);
      fetchProducts();
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar definitivamente "${product.name}"?\n\nEsto borra el producto de la base de datos.`)) return;
    const res = await fetch(`/api/admin/products?id=${product.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Error al eliminar");
      return;
    }
    setEditing(null);
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
            <div className="flex gap-2">
              <input placeholder="Precio *" type="number" value={formData.resellerPrice} onChange={(e) => setFormData({ ...formData, resellerPrice: e.target.value })} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="border rounded-lg px-2 py-2 text-sm bg-white">
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Descripción" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? "Guardando..." : "Crear producto"}
            </button>
          </div>
          {formData.currency === "USD" && usdRate && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              El precio se guarda en USD y se muestra al cliente en pesos según la cotización del Banco Nación. Cotización actual: <strong>USD = ${usdRate.toLocaleString("es-AR")}</strong>. Ejemplo: USD ${formData.resellerPrice || "100"} → ARS ${(parseFloat(formData.resellerPrice || "100") * usdRate).toLocaleString("es-AR", { maximumFractionDigits: 0 })}.
            </p>
          )}
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
                <td className="px-4 py-3 whitespace-nowrap">
                  <button onClick={() => openEdit(p)} className="text-xs text-brand-600 hover:underline mr-3">
                    Editar
                  </button>
                  <button onClick={() => toggleActive(p)} className={`text-xs ${p.active ? "text-red-500" : "text-green-500"} hover:underline`}>
                    {p.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl border max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Editar producto</h2>
              <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">SKU: {editing.sku}</p>

            {/* Image upload */}
            <div className="mb-4 flex items-start gap-3">
              <div className="w-24 h-24 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {editImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={editImage} alt="Producto" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-2">Sin imagen</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="text-xs text-gray-500">Imagen del producto</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100">
                      {uploadingImg ? "Subiendo..." : (editImage ? "Cambiar" : "Subir imagen")}
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImg} className="hidden" />
                    </label>
                    {editImage && (
                      <button onClick={handleImageDelete} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">JPG/PNG, máx 5 MB</p>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Precio</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editForm.resellerPrice}
                      onChange={(e) => setEditForm({ ...editForm, resellerPrice: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
                    />
                    <select
                      value={editForm.currency}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.stockStatus}
                  onChange={(e) => setEditForm({ ...editForm, stockStatus: e.target.checked })}
                  className="rounded"
                />
                Hay stock disponible
              </label>

              {editForm.currency === "USD" && usdRate && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  USD ${editForm.resellerPrice || "0"} → ARS ${(parseFloat(editForm.resellerPrice || "0") * usdRate).toLocaleString("es-AR", { maximumFractionDigits: 0 })} (BNA: ${usdRate.toLocaleString("es-AR")})
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mt-6">
              {editing.isManual && (
                <button
                  onClick={() => handleDelete(editing)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Eliminar producto
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setEditing(null)}
                  disabled={editSaving}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {editSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
