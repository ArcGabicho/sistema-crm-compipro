import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { categorias } from "@/app/api/products/data";

const CATALOGO_PDF =
  "https://compipro.net/documentos/catalogo-compipro/Catalogo_Compipro.pdf";

const productos = categorias.flatMap((c) => c.productos);
const totalProductos = new Set(productos.map((p) => p.id)).size;

const DESTACADOS = [
  "/assets/tecnologicos/blueto-speaker.jpg",
  "/assets/ecologicos/vaso-ecologico.jpg",
  "/assets/tecnologicos/usb-ecologico.jpg",
  "/assets/premium/set-ejecutivo.jpg",
]
  .map((imagen) => productos.find((p) => p.imagen === imagen))
  .filter((p): p is (typeof productos)[number] => Boolean(p));

const stats = [
  { value: `+${totalProductos}`, label: "Productos en catálogo" },
  { value: `${categorias.length}`, label: "Líneas de producto" },
  { value: "Todo el Perú", label: "Cobertura de entrega" },
];

export default function Hero() {
  return (
    <section className="relative mx-3 mt-24 overflow-hidden rounded-[2rem] bg-ink text-white sm:mt-28 md:rounded-[2.5rem]">
      {/* Formas decorativas */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8">
        {/* Texto */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-panel" />
            30% de descuento
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Artículos importados,{" "}
            <span className="text-accent">listos para tu marca</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            Explora nuestro catálogo de productos promocionales y personalízalos
            sin complicaciones ni largas esperas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={CATALOGO_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <Download className="h-5 w-5" />
              Descargar catálogo
            </a>
            <Link
              href="/contacto"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-6 py-3 text-base font-semibold text-white ring-1 ring-white/20 transition-colors duration-300 hover:bg-white/20"
            >
              Solicitar cotización
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Métricas */}
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xl font-bold sm:text-2xl">{stat.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-white/60">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Collage de productos reales */}
        <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4 sm:max-w-lg">
          {DESTACADOS.map((producto, i) => (
            <div
              key={producto.id}
              className={`group relative aspect-square overflow-hidden rounded-[1.75rem] bg-panel shadow-xl ring-1 ring-white/40 ${
                i % 2 === 1 ? "translate-y-6" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-x-3 bottom-3 truncate rounded-full bg-panel/90 px-3 py-1.5 text-center text-xs font-semibold text-ink shadow-sm backdrop-blur-sm">
                {producto.nombre}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
