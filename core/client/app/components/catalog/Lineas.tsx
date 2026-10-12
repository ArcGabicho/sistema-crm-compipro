import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { categorias } from "@/app/api/products/data";

const totalProductos = new Set(
  categorias.flatMap((c) => c.productos.map((p) => p.id)),
).size;

export default function Lineas() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
          Catálogo
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Todas nuestras líneas
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-500">
          {categorias.length} líneas y más de {totalProductos} productos listos
          para personalizar con la identidad de tu marca.
        </p>
        <div className="mx-auto mt-6 h-1.5 w-16 rounded-full hatch-accent" />
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categorias.map((c, index) => (
          <Link
            key={c.id}
            href={`/${c.id}`}
            aria-label={`Ver la línea ${c.nombre}`}
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            className="animate-fade-in-up group flex flex-col overflow-hidden rounded-[1.75rem] bg-panel p-2 shadow-sm ring-1 ring-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:ring-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="aspect-4/3 overflow-hidden rounded-[1.4rem] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.portada}
                alt={c.nombre}
                loading="lazy"
                className="h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-ink transition-colors duration-300 group-hover:text-orange-600">
                  {c.nombre}
                </h3>
                <p className="text-xs text-neutral-500">
                  {c.productos.length} productos
                </p>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-accent">
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
        >
          <Search className="h-4 w-4" />
          Buscar un producto específico
        </Link>
      </div>
    </section>
  );
}
