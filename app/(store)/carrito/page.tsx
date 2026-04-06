"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../components/CartProvider";
import { formatPrice } from "../../components/ProductCard";

export default function CartPage() {
  const { items, totalPrice, updateQty, removeItem, clearCart } = useCart();
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491171409081";

  const handleCheckout = () => {
    if (items.length === 0) return;

    let msg = "Hola! Quiero hacer un pedido:\n\n";
    items.forEach((item, i) => {
      msg += `${i + 1}. *${item.name}*\n`;
      msg += `   SKU: ${item.sku} | Cant: ${item.qty} | ${formatPrice(item.price * item.qty)}\n`;
    });
    msg += `\n*Total: ${formatPrice(totalPrice)}*`;
    msg += "\n\nQuedo a la espera de confirmación. Gracias!";

    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-6">Agregá productos para hacer tu pedido</p>
        <Link href="/" className="btn-primary inline-block">Ver productos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Mi Carrito ({items.length})</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:underline">
          Vaciar carrito
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
            <div className="relative w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-contain p-1" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
              <p className="text-xs text-gray-400">SKU: {item.sku}</p>
              <p className="text-sm font-bold text-[#1e3a5f] mt-1">{formatPrice(item.price * item.qty)}</p>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100">
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
              <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100">
                +
              </button>
            </div>

            <button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Total + Checkout */}
      <div className="bg-white rounded-xl border p-6 sticky bottom-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-medium text-gray-700">Total</span>
          <span className="text-2xl font-bold text-[#1e3a5f]">{formatPrice(totalPrice)}</span>
        </div>
        <button onClick={handleCheckout} className="btn-whatsapp w-full justify-center text-lg py-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.624-1.467A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.115 0-4.142-.655-5.854-1.893l-.42-.292-2.744.87.913-2.659-.32-.462A9.705 9.705 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" />
          </svg>
          Pedir por WhatsApp
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Se abrirá WhatsApp con tu pedido. Nuestro equipo te confirmará disponibilidad y precio.
        </p>
      </div>
    </div>
  );
}
