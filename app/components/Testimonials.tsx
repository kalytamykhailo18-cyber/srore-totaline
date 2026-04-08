"use client";

import { useEffect, useRef, useState } from "react";

interface Testimonial {
  name: string;
  role: string;
  location: string;
  text: string;
  rating: number;
  avatar: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Juan Martínez",
    role: "Técnico en refrigeración",
    location: "Buenos Aires",
    text: "Hace dos años que les compro repuestos. Siempre tienen lo que necesito y los precios son los mejores del rubro. La atención por WhatsApp es muy rápida.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Carlos Pereyra",
    role: "Instalador HVAC",
    location: "Córdoba",
    text: "Pedí gases refrigerantes y compresores para un trabajo grande y me llegó todo a Córdoba en 48hs. Excelente servicio, voy a seguir comprando.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    name: "Mariana López",
    role: "Servicio técnico",
    location: "Rosario",
    text: "Conseguí componentes electrónicos que en otros lados no había forma de encontrar. Asesoramiento técnico de primera, me ayudaron a elegir el repuesto correcto.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Diego Fernández",
    role: "Mantenimiento industrial",
    location: "Mendoza",
    text: "Trabajo con cámaras comerciales y siempre les compro a ellos. Variedad enorme de marcas, precios honestos y muy responsables con los envíos.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
  },
  {
    name: "Lucía Romero",
    role: "Frigorista",
    location: "Mar del Plata",
    text: "Compré un kit completo para una instalación y todo perfecto. Me asesoraron sin apuro y me mandaron los repuestos exactos que necesitaba.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused]);

  const next = () => setIndex((i) => (i + 1) % TESTIMONIALS.length);
  const prev = () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-brand-800 text-center mb-2">Lo que dicen nuestros clientes</h2>
        <p className="text-gray-500 text-center mb-12">Profesionales que ya confían en nosotros</p>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Carousel viewport */}
          <div className="overflow-hidden rounded-2xl">
            <div
              ref={trackRef}
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="w-full flex-shrink-0 px-4 sm:px-12">
                  <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 md:p-12 shadow-sm relative min-h-[280px]">
                    <svg className="absolute top-4 left-4 w-12 h-12 text-brand-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.748-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h3.983v10h-9.966z" />
                    </svg>

                    <div className="relative pl-4">
                      <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6 italic">
                        {t.text}
                      </p>

                      <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-brand-800">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.role} — {t.location}</p>
                          <div className="flex gap-0.5 mt-1">
                            {Array.from({ length: t.rating }).map((_, i) => (
                              <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow buttons */}
          <button
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-brand-200 text-brand-800 shadow-md hover:bg-brand-50 hover:border-brand-400 transition-colors flex items-center justify-center -translate-x-1/2 md:translate-x-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-brand-200 text-brand-800 shadow-md hover:bg-brand-50 hover:border-brand-400 transition-colors flex items-center justify-center translate-x-1/2 md:translate-x-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-brand-800" : "w-2 bg-brand-300 hover:bg-brand-400"}`}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
