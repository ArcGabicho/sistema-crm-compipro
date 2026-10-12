import { ArrowRight } from "lucide-react";

const stats = [
  { value: "+10.000", label: "Productos personalizados" },
  { value: "+5", label: "Años de experiencia" },
  { value: "Miles", label: "De clientes atendidos" },
];

export default function Hero() {
  return (
    <section className="relative mx-3 mt-24 overflow-hidden sm:mt-28 rounded-[2rem] bg-accent text-ink md:rounded-[2.5rem]">
      {/* Formas decorativas */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-orange-300/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
        {/* Texto */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Agencia de merchandising
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Descubre la agencia de merchandising{" "}
            <span className="text-white">Compipro</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/75 sm:text-lg">
            Una de las agencias más confiables del Perú: más de 10.000 productos
            personalizados para miles de clientes.
          </p>

          <a
            href="https://agenciadigitalnet.net"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-base font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
          >
            Conócenos
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>

          {/* Métricas */}
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-ink/15 pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xl font-bold sm:text-3xl">{stat.value}</dt>
                <dd className="mt-1 text-xs leading-snug text-ink/65">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Imagen */}
        <div className="relative flex justify-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-4/5 w-4/5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/web/herocatalogo.png"
            alt="Productos de merchandising"
            className="relative w-4/5 max-w-md h-auto drop-shadow-2xl lg:w-full"
          />
        </div>
      </div>
    </section>
  );
}
