import type { FC } from "react";
import Sparkles from "../../icons/Sparkles";
import Heart from "../../icons/Heart";
import Currency from "../../icons/Currency";

type IconName = "sparkles" | "heart" | "currency";

type Valor = {
  title: string;
  text: string;
  videoSrc: string;
  overlayText: string;
  icon: IconName;
};

const valores: Valor[] = [
  {
    title: "Deja tu huella",
    text: "Las prendas de vestir reflejan mucho la personalidad de las personas, ten la oportunidad de dejar tu propia huella en el mercado.",
    videoSrc: "/videos/vprom01.mp4",
    overlayText: "",
    icon: "sparkles",
  },
  {
    title: "Compromiso Contigo",
    text: "En COMPIPRO sabemos que las marcas de nuestros clientes tienen un valor muy especial y es por ello que los ayudamos a seguir creciendo.",
    videoSrc: "/videos/vprom02.mp4",
    overlayText: "¡Comprometidos!",
    icon: "heart",
  },
  {
    title: "Hábitos Ahorradores",
    text: "El ahorro es un gran recurso para poder cubrir gastos de imprevistos o realizar una futura inversión de la mejor manera.",
    videoSrc: "/videos/vprom03.mp4",
    overlayText: "",
    icon: "currency",
  },
];

const icons: Record<IconName, FC<{ className?: string }>> = {
  sparkles: Sparkles,
  heart: Heart,
  currency: Currency,
};

export default function Valores() {
  return (
    <div className="max-w-7xl mx-auto px-4 text-center py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">
        POTENCIAMOS TU CRECIMIENTO
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {valores.map((valor) => {
          const Icon = icons[valor.icon];
          return (
            <div key={valor.title} className="group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 mb-8">
                {/* Video Container */}
                <div className="relative w-full h-48 overflow-hidden">
                  {valor.overlayText && (
                    <div
                      className="absolute inset-0 flex items-center justify-center z-10"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, rgba(255,255,255,0.6), rgba(255,255,255,0.6) 10px, transparent 10px, transparent 20px)",
                      }}
                    >
                      <span className="text-white font-bold text-lg drop-shadow-lg">
                        {valor.overlayText}
                      </span>
                    </div>
                  )}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src={valor.videoSrc} type="video/mp4" />
                    Tu navegador no soporta videos.
                  </video>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <Icon />
                  </div>
                  <h5 className="font-bold text-lg md:text-xl text-gray-800 mb-3">
                    {valor.title}
                  </h5>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                    {valor.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
