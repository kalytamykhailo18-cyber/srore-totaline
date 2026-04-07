"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../../components/CartProvider";
import { formatPrice } from "../../../components/ProductCard";

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  resellerPrice: number;
  localImage: string | null;
  imageUrl: string | null;
  stockStatus: boolean;
  category: { id: number; name: string; slug: string } | null;
}

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-2/3" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-12 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-xl text-gray-500">Producto no encontrado</p>
        <Link href="/" className="btn-primary inline-block mt-4">Volver al inicio</Link>
      </div>
    );
  }

  const imgSrc = product.localImage || product.imageUrl || "/logo.png";
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491171409081";

  const handleAdd = () => {
    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.resellerPrice,
      image: product.localImage || product.imageUrl,
    }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const askWhatsApp = () => {
    const msg = `Hola, quiero consultar por:\n*${product.name}*\nSKU: ${product.sku}\nPrecio: ${formatPrice(product.resellerPrice)}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-800">Inicio</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/categoria/${product.category.slug}`} className="hover:text-brand-800">{product.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-800 truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative aspect-square bg-white rounded-xl border overflow-hidden">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
          {!product.stockStatus && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Sin stock
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
          <p className="text-sm text-gray-400 mb-4">SKU: {product.sku}</p>

          <div className="text-3xl font-bold text-brand-800 mb-6">
            {formatPrice(product.resellerPrice)}
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-6 ${product.stockStatus ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <span className={`w-2 h-2 rounded-full ${product.stockStatus ? "bg-green-500" : "bg-red-500"}`} />
            {product.stockStatus ? "En stock" : "Sin stock"}
          </div>

          {product.description && (
            <p className="text-gray-600 mb-6">{product.description}</p>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">-</button>
              <span className="px-4 py-2 font-medium min-w-[40px] text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 hover:bg-gray-100 transition-colors">+</button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!product.stockStatus}
              className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {added ? "Agregado!" : "Agregar al carrito"}
            </button>
          </div>

          <button onClick={askWhatsApp} className="btn-whatsapp w-full justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.624-1.467A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.115 0-4.142-.655-5.854-1.893l-.42-.292-2.744.87.913-2.659-.32-.462A9.705 9.705 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" />
            </svg>
            Consultar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
