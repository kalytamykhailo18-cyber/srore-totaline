"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProductCard from "../../../../components/ProductCard";
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

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get category ID from slug
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cats) => {
        const cat = cats.find((c: { slug: string }) => c.slug === slug);
        if (cat) {
          setCategoryName(cat.name);
          return fetch(`/api/products?categoryId=${cat.id}&page=${page}`);
        }
        throw new Error("Not found");
      })
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products);
        setTotalPages(data.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, page]);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-brand-800">Inicio</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{categoryName || slug}</span>
      </div>

      <h1 className="text-2xl font-bold text-brand-800 mb-6">{categoryName || "Categoría"}</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center py-20 text-gray-500">No hay productos en esta categoría</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40">
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">Página {page} de {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40">
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
