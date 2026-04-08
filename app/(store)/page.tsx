import Link from "next/link";
import Testimonials from "../components/Testimonials";

export default function LandingPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491171409081";

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/hero1.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Refrigeración Perez
            </h1>
            <p className="text-lg md:text-2xl text-brand-100 mb-8 max-w-xl">
              Repuestos, equipos y servicio técnico para refrigeración y climatización. Atendemos en todo el país.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/categoria/unidades-condensadoras"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-800 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
              >
                Ver productos
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.624-1.467A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.115 0-4.142-.655-5.854-1.893l-.42-.292-2.744.87.913-2.659-.32-.462A9.705 9.705 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" />
                </svg>
                Contactanos
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Refrigeración Perez" className="w-72 h-72 rounded-full shadow-2xl border-4 border-white/20" />
          </div>
        </div>
      </section>

      {/* Categorías destacadas / qué ofrecemos */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-brand-800 text-center mb-2">¿Qué ofrecemos?</h2>
          <p className="text-gray-500 text-center mb-12">Todo lo que necesitás para refrigeración y climatización</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card group hover:border-brand-400 transition-all">
              <div className="aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hero/repuestos.jpg" alt="Repuestos" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-brand-800 mb-1">Repuestos</h3>
                <p className="text-sm text-gray-500">Compresores, motores, filtros, válvulas, gases refrigerantes y componentes electrónicos.</p>
              </div>
            </div>
            <div className="card group hover:border-brand-400 transition-all">
              <div className="aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hero/instalacion.jpg" alt="Instalación" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-brand-800 mb-1">Equipos completos</h3>
                <p className="text-sm text-gray-500">Equipos split, comerciales, condensadoras, evaporadores y línea light commercial.</p>
              </div>
            </div>
            <div className="card group hover:border-brand-400 transition-all">
              <div className="aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hero/herramientas.jpg" alt="Herramientas" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-brand-800 mb-1">Herramientas e insumos</h3>
                <p className="text-sm text-gray-500">Bombas de vacío, manómetros, sopletes, accesorios de cobre y materiales de instalación.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-16 bg-gradient-to-r from-brand-800 to-brand-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Más de 2.700 productos en stock</h2>
          <p className="text-brand-100 text-lg mb-8">
            Catálogo completo con precios actualizados y entrega a todo el país.
          </p>
          <Link
            href="/categoria/unidades-condensadoras"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-800 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
          >
            Explorar catálogo
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Por qué nosotros */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Productos originales</h3>
              <p className="text-sm text-gray-500">Trabajamos solo con marcas reconocidas del rubro.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Atención personalizada</h3>
              <p className="text-sm text-gray-500">Te asesoramos por WhatsApp para encontrar lo que necesitás.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m12 0h-9m4 0H9m8 0h1a1 1 0 001-1v-3.65a1 1 0 00-.22-.624l-3.48-4.35A1 1 0 0015.52 8H13" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Envíos a todo el país</h3>
              <p className="text-sm text-gray-500">Coordinamos despacho con la transportadora que prefieras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <Testimonials />
    </div>
  );
}
