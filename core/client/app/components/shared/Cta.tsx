import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

type CtaProps = {
  title?: string;
  description?: string;
};

export default function Cta({
  title = "¿No encuentras lo que buscas?",
  description = "Cuéntanos tu idea y cotizamos el artículo ideal para tu marca, con entrega en todo el Perú.",
}: CtaProps) {
  return (
    <section className="mx-3 mb-12 overflow-hidden rounded-[2rem] bg-accent text-ink md:rounded-[2.5rem]">
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:justify-between md:py-14 md:text-left lg:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="relative max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-ink/75">
            {description}
          </p>
        </div>
        <div className="relative flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contacto"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
          >
            Solicitar cotización
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://wa.me/51973644878"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-ink shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
