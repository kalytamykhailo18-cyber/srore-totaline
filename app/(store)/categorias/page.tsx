"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6">Categorías</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories
            .filter((c) => c._count.products > 0)
            .map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#1e3a5f] hover:shadow-md transition-all text-center group"
              >
                <h2 className="font-semibold text-gray-800 group-hover:text-[#1e3a5f] transition-colors">
                  {cat.name}
                </h2>
                <p className="text-sm text-gray-400 mt-1">{cat._count.products} productos</p>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
