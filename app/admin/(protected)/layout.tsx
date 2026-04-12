"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HiMenu, HiOutlineX } from "react-icons/hi";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/sync", label: "Sincronización" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close drawer when route changes
  useEffect(() => { setOpen(false); }, [pathname]);

  const currentLink = links.find((l) => l.href === pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <nav className="bg-brand-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-3">
            {/* Mobile: page title */}
            <div className="md:hidden flex-1 font-bold text-base truncate">
              {currentLink?.label || "Admin"}
            </div>

            {/* Desktop: full nav */}
            <Link href="/" className="hidden md:inline font-bold text-sm mr-4 whitespace-nowrap opacity-60 hover:opacity-100">
              &larr; Tienda
            </Link>
            <div className="hidden md:flex items-center gap-6 flex-1 overflow-x-auto">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm whitespace-nowrap py-2 border-b-2 transition-colors ${
                    pathname === link.href
                      ? "border-white font-medium"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <button
              onClick={logout}
              className="hidden md:inline-flex text-sm whitespace-nowrap py-1.5 px-3 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile floating menu button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-30 flex items-center gap-2 px-4 py-3 bg-brand-800 text-white rounded-full shadow-lg text-sm font-medium"
      >
        <HiMenu className="w-5 h-5" />
        Menú
      </button>

      {/* Mobile drawer overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b bg-brand-900 text-white">
          <h2 className="font-semibold text-lg">Panel Admin</h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            href="/"
            className="block px-3 py-2.5 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            ← Volver a la tienda
          </Link>
          <div className="border-t my-2" />
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 text-sm rounded-lg ${
                pathname === link.href
                  ? "bg-brand-50 text-brand-800 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={logout}
            className="w-full px-3 py-2.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</div>
    </div>
  );
}
