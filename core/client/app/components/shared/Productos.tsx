import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { categorias as lineas } from "@/app/api/products/data";

type Categoria = {
  id: string;
  nombre: string;
  descripcion: string;
  portada: string;
};

const categorias: Categoria[] = [
  {
    id: "textil",
    nombre: "Textiles",
    descripcion: "Camisetas, polos, sudaderas y más prendas personalizadas",
    portada: "/web/textileria.webp",
  },
  {
    id: "promocionales",
    nombre: "Promocionales",
    descripcion: "Artículos promocionales para eventos y campañas",
    portada: "/web/regalosCorporativos.webp",
  },
  {
    id: "articulos-oficina",
    nombre: "Oficina",
    descripcion: "Artículos de oficina personalizados y corporativos",
    portada: "/web/papeleria.webp",
  },
  {
    id: "tecnologicos",
    nombre: "Tecnológicos",
    descripcion: "Dispositivos y accesorios tecnológicos personalizados",
    portada: "/web/tecnologico.webp",
  },
  {
    id: "bolsas-empaques",
    nombre: "Bolsas y Empaques",
    descripcion: "Bolsas ecológicas, mochilas y soluciones de empaque",
    portada: "/assets/bolsas-empaques/bolsa-tela.jpg",
  },
  {
    id: "premium",
    nombre: "Premium",
    descripcion: "Productos de alta calidad y acabados especiales",
    portada: "/assets/premium/set-ejecutivo.jpg",
  },
];

export default function Productos() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
      {/* Encabezado */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
          <Sparkles className="h-3.5 w-3.5" />
          Catálogo
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Nuestros Productos
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-500">
          Explora nuestras líneas de merchandising y personaliza cada artículo
          con la identidad de tu marca.
        </p>
        <div className="mx-auto mt-6 h-1.5 w-16 rounded-full hatch-accent" />
      </div>

      {/* Grid de categorías */}
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        {categorias.map((categoria, index) => (
          <Link
            key={categoria.id}
            href={`/${categoria.id}`}
            aria-label={`Ver categoría ${categoria.nombre}`}
            style={{ animationDelay: `${index * 80}ms` }}
            className="animate-fade-in-up group flex flex-col overflow-hidden rounded-[1.75rem] bg-panel shadow-sm ring-1 ring-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:ring-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {/* Imagen + nombre superpuesto */}
            <div className="relative aspect-16/10 overflow-hidden bg-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={categoria.portada}
                alt={categoria.nombre}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
              <h3 className="absolute inset-x-4 bottom-3 text-lg font-bold text-white drop-shadow-sm">
                {categoria.nombre}
              </h3>
            </div>

            {/* Cuerpo */}
            <div className="flex flex-1 flex-col p-5">
              <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">
                {categoria.descripcion}
              </p>

              <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-orange-600">
                Ver productos
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/catalogo"
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
        >
          Ver las {lineas.length} líneas del catálogo
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}