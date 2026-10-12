import Link from "next/link";
import { ArrowRight } from "lucide-react";

const stats = [
  { value: "+10.000", label: "Productos personalizados" },
  { value: "+5", label: "Años de experiencia" },
  { value: "Miles", label: "De clientes atendidos" },
];

export default function Hero() {
  return (
    <section className="relative mx-3 mt-24 overflow-hidden rounded-[2rem] bg-panel shadow-sm ring-1 ring-white sm:mt-28 md:rounded-[2.5rem]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:px-8">
        {/* Texto */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Sobre nosotros
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Somos <span className="text-accent">Compipro</span>, tu aliado en
            merchandising
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Empresa peruana dedicada a la oferta de artículos y productos
            publicitarios de alta calidad y diseño para eventos, ferias, regalos
            corporativos y la industria en general.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">
            Contamos con infraestructura propia y trabajamos con partners
            estratégicos a nivel nacional e internacional, lo que nos permite
            brindar mayor calidad, rapidez y garantía a costos muy competitivos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/productos"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 hover:shadow-lg"
            >
              Ver productos
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
            >
              Contáctanos
            </Link>
          </div>

          {/* Métricas */}
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-neutral-200/80 pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xl font-bold text-ink sm:text-3xl">{stat.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-neutral-500">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Collage: cada imagen es un mosaico de 3 fotos, se recorta el panel deseado */}
        <div className="relative grid h-[22rem] grid-cols-5 grid-rows-2 gap-4 sm:h-[28rem]">
          <figure className="relative col-span-3 row-span-2 overflow-hidden rounded-[1.75rem] bg-ink shadow-xl ring-1 ring-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/web/imagenhero4.webp"
              alt="Equipo de Compipro revisando una impresión"
              className="absolute right-0 top-0 h-full w-auto max-w-none"
            />
          </figure>
          <figure className="relative col-span-2 overflow-hidden rounded-[1.75rem] bg-ink shadow-xl ring-1 ring-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/web/imagenhero4.webp"
              alt="Impresión digital en gran formato"
              className="absolute left-0 top-0 h-[200%] w-auto max-w-none"
            />
          </figure>
          <figure className="relative col-span-2 overflow-hidden rounded-[1.75rem] bg-ink shadow-xl ring-1 ring-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/web/imagenhero5.webp"
              alt="Bolsa de tela personalizada"
              className="absolute left-0 top-0 h-[200%] w-auto max-w-none"
            />
          </figure>

          <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-5 text-white shadow-lg sm:left-6">
            <span className="hatch-accent grid size-9 place-items-center rounded-full text-sm font-bold text-ink">
              +5
            </span>
            <span className="text-sm font-medium">años personalizando marcas</span>
          </div>
        </div>
      </div>
    </section>
  );
}
