import type { Metadata } from "next";
import "./globals.css";

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Perez Refrigeración";

export const metadata: Metadata = {
  title: `${businessName} — Productos de Refrigeración`,
  description: "Venta de productos de refrigeración y climatización. Totaline, repuestos y accesorios.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
