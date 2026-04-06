"use client";
import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import Link from "next/link";

interface Product {
  id: number;
  sku: string;
  name: string;
  resellerPrice: number;
  localImage: string | null;
  imageUrl: string | null;
  stockStatus: boolean;
  category: { name: string; slug: string } | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    if (q) setSearch(q);
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", String(page));

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Categories bar */}
      {!search && categories.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories
              .filter((c) => c._count.products > 0)
              .map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-[#1e3a5f] hover:text-white hover:border-[#1e3a5f] transition-colors"
                >
                  {cat.name} <span className="text-gray-400 ml-1">({cat._count.products})</span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Search indicator */}
      {search && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-gray-600">
            Resultados para &quot;<span className="font-medium">{search}</span>&quot; ({total})
          </p>
          <button
            onClick={() => {
              setSearch("");
              window.history.replaceState(null, "", "/");
            }}
            className="text-sm text-red-500 hover:underline"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-lg">No se encontraron productos</p>
          {search && <p className="text-sm mt-2">Intentá con otros términos de búsqueda</p>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
