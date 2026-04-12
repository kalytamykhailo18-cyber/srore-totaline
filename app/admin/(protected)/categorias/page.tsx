"use client";
import { useState, useEffect, useCallback } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  parentId: number | null;
  parent: { id: number; name: string } | null;
  _count: { products: number };
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, parentId: newParentId ? parseInt(newParentId) : null }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      setNewName("");
      setNewParentId("");
      setShowForm(false);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName }),
    });
    setEditId(null);
    fetchCategories();
  };

  const handleDelete = async (cat: Category) => {
    if (cat._count.products > 0) {
      alert(`No se puede eliminar: tiene ${cat._count.products} productos`);
      return;
    }
    if (!confirm(`Eliminar categoría "${cat.name}"?`)) return;
    await fetch(`/api/admin/categories?id=${cat.id}`, { method: "DELETE" });
    fetchCategories();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categorías ({categories.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? "Cancelar" : "+ Nueva categoría"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-4 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Nombre *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="Nombre de la categoría" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Categoría padre</label>
            <select value={newParentId} onChange={(e) => setNewParentId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
              <option value="">Ninguna (raíz)</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm disabled:opacity-50 whitespace-nowrap">
            {saving ? "Creando..." : "Crear"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Padre</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Productos</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editId === cat.id ? (
                    <div className="flex gap-2">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)} />
                      <button onClick={() => handleUpdate(cat.id)} className="text-xs text-green-600 hover:underline">OK</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:underline">X</button>
                    </div>
                  ) : (
                    <span className="font-medium cursor-pointer hover:text-brand-800" onClick={() => { setEditId(cat.id); setEditName(cat.name); }}>
                      {cat.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-500">{cat.parent?.name || "-"}</td>
                <td className="px-4 py-3 text-center">{cat._count.products}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(cat)} className="text-xs text-red-500 hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
