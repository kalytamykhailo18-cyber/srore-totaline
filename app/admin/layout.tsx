"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/sync", label: "Sincronización" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#152d4a] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-6 overflow-x-auto">
            <Link href="/" className="font-bold text-sm mr-4 whitespace-nowrap opacity-60 hover:opacity-100">
              &larr; Tienda
            </Link>
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
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
