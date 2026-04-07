"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { totalItems } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/?q=${encodeURIComponent(search.trim())}`;
    }
  };

  return (
    <nav className="bg-brand-800 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Refrigeración Perez" className="h-10 w-10 rounded-full" />
            <span className="text-lg font-bold tracking-wide hidden sm:inline">REFRIGERACIÓN PEREZ</span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs mx-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full px-4 py-2 rounded-l-lg text-gray-800 focus:outline-none text-sm"
            />
            <button type="submit" className="bg-brand-600 px-3 py-2 rounded-r-lg hover:bg-brand-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
              title="Panel de administración"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin
            </Link>
            <Link href="/carrito" className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-white/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search + menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full px-4 py-2 rounded-l-lg text-gray-800 focus:outline-none"
              />
              <button type="submit" className="bg-brand-600 px-4 py-2 rounded-r-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            <Link href="/carrito" className="block px-3 py-2 hover:bg-white/10 rounded" onClick={() => setMenuOpen(false)}>
              Mi Carrito
            </Link>
            <Link href="/admin" className="block px-3 py-2 hover:bg-white/10 rounded" onClick={() => setMenuOpen(false)}>
              Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
