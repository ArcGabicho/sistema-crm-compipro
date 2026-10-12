import { BadgeCheck, Clock, HeartHandshake, Palette, type LucideIcon } from "lucide-react";

type Valor = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const data: Valor[] = [
  {
    icon: Palette,
    title: "Creatividad",
    description: "Buscamos soluciones innovadoras y únicas para cada desafío.",
  },
  {
    icon: Clock,
    title: "Puntualidad",
    description: "Cumplimos con nuestros compromisos en el tiempo acordado.",
  },
  {
    icon: BadgeCheck,
    title: "Calidad",
    description: "Nos comprometemos con la excelencia en cada servicio.",
  },
  {
    icon: HeartHandshake,
    title: "Atención",
    description: "Brindamos un servicio personalizado y cercano.",
  },
];

export default function Valores() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
          Lo que nos mueve
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Nuestros valores
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-500">
          Los principios con los que acompañamos cada proyecto de nuestros
          clientes.
        </p>
        <div className="mx-auto mt-6 h-1.5 w-16 rounded-full hatch-accent" />
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.map(({ icon: Icon, title, description }, index) => {
          const destacado = index === 0;
          return (
            <article
              key={title}
              className={`group flex flex-col rounded-[1.75rem] p-6 shadow-sm ring-1 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl ${
                destacado
                  ? "bg-accent ring-accent"
                  : "bg-panel ring-white hover:ring-accent/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-full bg-ink text-white">
                  <Icon className="size-5" />
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    destacado ? "bg-white/30 text-ink" : "hatch-accent text-orange-800"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-semibold tracking-tight text-ink">
                {title}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  destacado ? "text-ink/75" : "text-neutral-500"
                }`}
              >
                {description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
