import { HeartHandshake, PiggyBank, Sparkles, type LucideIcon } from "lucide-react";

type Valor = {
  title: string;
  text: string;
  videoSrc: string;
  overlayText: string;
  icon: LucideIcon;
};

const valores: Valor[] = [
  {
    title: "Deja tu huella",
    text: "Las prendas de vestir reflejan mucho la personalidad de las personas, ten la oportunidad de dejar tu propia huella en el mercado.",
    videoSrc: "/videos/vprom01.mp4",
    overlayText: "",
    icon: Sparkles,
  },
  {
    title: "Compromiso Contigo",
    text: "En COMPIPRO sabemos que las marcas de nuestros clientes tienen un valor muy especial y es por ello que los ayudamos a seguir creciendo.",
    videoSrc: "/videos/vprom02.mp4",
    overlayText: "¡Comprometidos!",
    icon: HeartHandshake,
  },
  {
    title: "Hábitos Ahorradores",
    text: "El ahorro es un gran recurso para poder cubrir gastos de imprevistos o realizar una futura inversión de la mejor manera.",
    videoSrc: "/videos/vprom03.mp4",
    overlayText: "",
    icon: PiggyBank,
  },
];

export default function Valores() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
          Por qué Compipro
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Potenciamos tu crecimiento
        </h2>
        <div className="mx-auto mt-6 h-1.5 w-16 rounded-full hatch-accent" />
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {valores.map(({ icon: Icon, ...valor }) => (
          <article
            key={valor.title}
            className="group flex flex-col rounded-[1.75rem] bg-panel p-2 shadow-sm ring-1 ring-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:ring-accent/50"
          >
            <div className="relative h-48 overflow-hidden rounded-[1.4rem] bg-ink">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              >
                <source src={valor.videoSrc} type="video/mp4" />
                Tu navegador no soporta videos.
              </video>
              {valor.overlayText && (
                <span className="hatch-accent absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-ink shadow-sm">
                  {valor.overlayText}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <span className="grid size-11 place-items-center rounded-full bg-ink text-white">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">
                {valor.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {valor.text}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
