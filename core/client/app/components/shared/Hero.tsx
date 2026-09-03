"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type HeroImage = {
  src: string;
  title: string;
  description: string;
  gradient: string;
};

const images: HeroImage[] = [
  {
    src: "/web/imagenhero1.webp",
    title: "Artículos impresión digital",
    description: "Producción de prendas y todo tipo de accesorios con el logo de marca.",
    gradient: "from-amber-900/80 via-orange-900/60 to-transparent",
  },
  {
    src: "/web/imagenhero2.webp",
    title: "Impresión de alta calidad",
    description: "Soluciones avanzadas en impresión digital y offset con tecnología de vanguardia.",
    gradient: "from-yellow-900/80 via-amber-900/60 to-transparent",
  },
  {
    src: "/web/imagenhero3.webp",
    title: "Innovación en diseño gráfico",
    description: "Diseño personalizado para publicidad y branding que impacta y conecta.",
    gradient: "from-orange-900/80 via-yellow-800/60 to-transparent",
  },
  {
    src: "/web/imagenhero4.webp",
    title: "Merchandising Empresarial",
    description: "Diseño de artículos publicitarios para empresas que buscan diferenciarse.",
    gradient: "from-amber-800/80 via-orange-800/60 to-transparent",
  },
  {
    src: "/web/imagenhero5.webp",
    title: "Soluciones Corporativas",
    description: "Productos promocionales que fortalecen la identidad de tu marca.",
    gradient: "from-yellow-800/80 via-amber-800/60 to-transparent",
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

  return (
    <div className="relative w-full h-[85vh] mt-14 overflow-hidden">
      {/* Hero Background Images */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={image.src}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentImage
                ? `opacity-100 scale-100 ${
                    isTransitioning ? "blur-sm" : "blur-0"
                  }`
                : "opacity-0 scale-105"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.title}
              className="w-full h-full object-cover object-center"
            />
            <div
              className={`absolute inset-0 bg-linear-to-br ${image.gradient}`}
            />
          </div>
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Header Text */}
        <div className="flex-1 flex items-center justify-center text-center px-4 pt-12">
          <div className="max-w-5xl mx-auto">
            <h1
              className={`text-white font-bold leading-tight transition-all duration-700 transform ${
                isTransitioning
                  ? "opacity-0 translate-y-4"
                  : "opacity-100 translate-y-0"
              } text-3xl sm:text-4xl lg:text-6xl xl:text-7xl mb-4`}
            >
              {images[currentImage].title}
            </h1>
            <p
              className={`text-white/90 font-medium max-w-3xl mx-auto transition-all duration-700 delay-100 transform ${
                isTransitioning
                  ? "opacity-0 translate-y-4"
                  : "opacity-100 translate-y-0"
              } text-base sm:text-lg lg:text-xl xl:text-2xl leading-relaxed`}
            >
              {images[currentImage].description}
            </p>

            {/* CTA Button */}
            <div
              className={`mt-6 transition-all duration-700 delay-200 transform ${
                isTransitioning
                  ? "opacity-0 translate-y-4"
                  : "opacity-100 translate-y-0"
              }`}
            >
              <Link
                href="/productos"
                className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-8 py-3 rounded-full font-medium text-base hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Explorar Productos
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="pb-8 flex justify-center space-x-2">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Ir a la diapositiva ${index + 1}`}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 hover:scale-110 ${
                index === currentImage
                  ? "w-8 bg-white shadow-md"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        aria-label="Diapositiva anterior"
        onClick={() =>
          goToSlide((currentImage - 1 + images.length) % images.length)
        }
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        aria-label="Diapositiva siguiente"
        onClick={() => goToSlide((currentImage + 1) % images.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export default Hero;