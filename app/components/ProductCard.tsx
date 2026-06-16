"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";

interface Props {
  product: {
    id: number;
    sku: string;
    modelCode?: string | null;
    name: string;
    resellerPrice: number;
    resellerPriceUsd?: number | null;
    localImage: string | null;
    imageUrl: string | null;
    stockStatus: boolean;
    category?: { name: string; slug: string } | null;
  };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(price);
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const imgSrc = product.localImage || product.imageUrl || "/logo.png";

  return (
    <div className="card flex flex-col">
      <Link href={`/producto/${product.id}`} className="block relative aspect-square bg-gray-50">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className={`object-contain p-2 ${!product.stockStatus ? "grayscale opacity-70" : ""}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
        />
        {!product.stockStatus && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-md text-xs font-medium shadow-sm">
            Sin stock
          </span>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        {product.category && (
          <Link href={`/categoria/${product.category.slug}`} className="text-xs text-brand-600 hover:underline mb-1">
            {product.category.name}
          </Link>
        )}
        <Link href={`/producto/${product.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-800 line-clamp-2 mb-2 flex-1">
          {product.name}
        </Link>
        <p className="text-xs text-gray-500 mb-1 font-mono truncate" title={product.modelCode || product.sku}>{product.modelCode || product.sku}</p>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-lg font-bold text-brand-800">{formatPrice(product.resellerPrice)}</span>
            {product.resellerPriceUsd && (
              <p className="text-[10px] text-gray-400 leading-tight">USD ${product.resellerPriceUsd.toLocaleString("es-AR")}</p>
            )}
          </div>
          <button
            onClick={() =>
              addItem({
                id: product.id,
                sku: product.sku,
                name: product.name,
                price: product.resellerPrice,
                image: product.localImage || product.imageUrl,
              })
            }
            disabled={!product.stockStatus}
            className="bg-brand-800 text-white p-2 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Agregar al carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export { formatPrice };
