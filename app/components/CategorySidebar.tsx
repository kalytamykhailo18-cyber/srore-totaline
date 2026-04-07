"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiMenu } from "react-icons/hi";

interface Category {
  id: number;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function CategorySidebar() {
  const pathname = usePathname();
  const activeSlug = pathname?.startsWith("/categoria/") ? pathname.replace("/categoria/", "") : undefined;
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Persist scroll position
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => sessionStorage.setItem("perezSidebarScrollY", String(el.scrollTop));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  });

  useEffect(() => {
    if (categories.length > 0 && listRef.current) {
      const saved = sessionStorage.getItem("perezSidebarScrollY");
      if (saved) listRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [categories]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const filtered = useMemo(() => {
    const visible = categories.filter((c) => c._count.products > 0);
    if (!filter.trim()) return visible;
    const term = filter.toLowerCase();
    return visible.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, filter]);

  const sidebarContent = (
    <nav className="p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Categorías</h2>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrar..."
        className="w-full px-3 py-1.5 border border-brand-800 rounded-lg text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 mb-2"
      />
      <ul ref={listRef} className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
        <li>
          <Link
            href="/"
            scroll={false}
            onClick={() => setOpen(false)}
            className={`block px-3 py-2 text-sm rounded-lg ${
              !activeSlug
                ? "bg-brand-50 text-brand-800 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Todas
          </Link>
        </li>
        {filtered.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/categoria/${cat.slug}`}
              scroll={false}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg ${
                activeSlug === cat.slug
                  ? "bg-brand-50 text-brand-800 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-xs text-gray-400 ml-2">{cat._count.products}</span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
        )}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-30 flex items-center gap-2 px-4 py-3 bg-brand-800 text-white rounded-full shadow-lg text-sm font-medium"
      >
        <HiMenu className="w-5 h-5" />
        Categorías
      </button>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="font-semibold text-gray-900 text-lg">Categorías</h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
          >
            ✕
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop static sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r bg-white">
        <div className="sticky top-16">{sidebarContent}</div>
      </aside>
    </>
  );
}
