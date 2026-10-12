"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

type HeroImage = {
  src: string;
  title: string;
  description: string;
};

const images: HeroImage[] = [
  {
    src: "/web/imagenhero1.webp",
    title: "Artículos impresión digital",
    description: "Producción de prendas y todo tipo de accesorios con el logo de marca.",
  },
  {
    src: "/web/imagenhero2.webp",
    title: "Impresión de alta calidad",
    description: "Soluciones avanzadas en impresión digital y offset con tecnología de vanguardia.",
  },
  {
    src: "/web/imagenhero3.webp",
    title: "Innovación en diseño gráfico",
    description: "Diseño personalizado para publicidad y branding que impacta y conecta.",
  },
  {
    src: "/web/imagenhero4.webp",
    title: "Merchandising Empresarial",
    description: "Diseño de artículos publicitarios para empresas que buscan diferenciarse.",
  },
  {
    src: "/web/imagenhero5.webp",
    title: "Soluciones Corporativas",
    description: "Productos promocionales que fortalecen la identidad de tu marca.",
  },
];

function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    if (index !== currentImage) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImage(index);
        setIsTransitioning(false);
      }, 500);
    }
  };

  const fade = isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0";

  return (
    <section className="relative mx-3 mt-24 h-[80dvh] min-h-[26rem] overflow-hidden rounded-[2rem] bg-ink sm:mt-28 md:rounded-[2.5rem]">
      {/* Fondos */}
      {images.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentImage
              ? `scale-100 opacity-100 ${isTransitioning ? "blur-sm" : "blur-0"}`
              : "scale-105 opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.title}
            className="h-full w-full object-cover object-center"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-linear-to-r from-neutral-950/85 via-neutral-950/45 to-neutral-950/10" />
      <div className="absolute inset-0 bg-linear-to-t from-neutral-950/70 via-transparent to-transparent" />

      {/* Contenido */}
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-8 sm:px-10 sm:pb-10 lg:px-14 lg:pb-14">
        <div className="max-w-2xl">
          <span
            className={`inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-all duration-700 ${fade}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Agencia de merchandising
          </span>
          <h1
            className={`mt-4 text-4xl font-bold leading-tight tracking-tight text-white transition-all duration-700 sm:text-5xl lg:text-6xl ${fade}`}
          >
            {images[currentImage].title}
          </h1>
          <p
            className={`mt-4 max-w-xl text-base leading-relaxed text-white/80 transition-all delay-100 duration-700 sm:text-lg ${fade}`}
          >
            {images[currentImage].description}
          </p>

          <div
            className={`mt-7 flex flex-col gap-3 transition-all delay-200 duration-700 sm:flex-row ${fade}`}
          >
            <Link
              href="/productos"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 hover:shadow-lg"
            >
              Explorar productos
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full bg-white/15 px-7 py-3 text-base font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors duration-300 hover:bg-white/25"
            >
              Solicitar cotización
            </Link>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="absolute bottom-8 right-6 z-20 hidden items-center gap-3 rounded-full bg-white/15 p-1.5 ring-1 ring-white/25 backdrop-blur-md sm:right-10 sm:bottom-10 md:flex lg:right-14 lg:bottom-14">
        <button
          type="button"
          aria-label="Diapositiva anterior"
          onClick={() => goToSlide((currentImage - 1 + images.length) % images.length)}
          className="grid size-9 place-items-center rounded-full bg-white text-ink transition-colors hover:bg-accent hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Ir a la diapositiva ${index + 1}`}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentImage ? "w-7 bg-accent" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Diapositiva siguiente"
          onClick={() => goToSlide((currentImage + 1) % images.length)}
          className="grid size-9 place-items-center rounded-full bg-white text-ink transition-colors hover:bg-accent hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

export default Hero;
