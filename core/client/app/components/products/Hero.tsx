import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

const CATALOGO_PDF =
  "https://compipro.net/documentos/catalogo-compipro/Catalogo_Compipro.pdf";

export default function Hero() {
  return (
    <section className="bg-linear-to-b from-orange-50/70 to-gray-100">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-24 pb-16 sm:px-6 md:grid-cols-2 md:gap-12 md:pt-28 md:pb-20 lg:px-8">
        {/* Texto */}
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            30% de descuento
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            Artículos importados,{" "}
            <span className="text-orange-600">listos para tu marca</span>
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-gray-600 md:mx-0">
            Explora nuestro catálogo de productos promocionales y personalízalos
            sin complicaciones ni largas esperas.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <a
              href={CATALOGO_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <Download className="h-5 w-5" />
              Descargar catálogo
            </a>
            <Link
              href="/contacto"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-base font-semibold text-gray-700 transition-colors duration-300 hover:text-orange-600"
            >
              Solicitar cotización
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Imagen */}
        <div className="relative flex justify-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/40 blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/web/HeroProductos.png"
            alt="Colección de artículos promocionales"
            className="relative w-4/5 max-w-md h-auto drop-shadow-xl md:w-full"
          />
        </div>
      </div>
    </section>
  );
}
