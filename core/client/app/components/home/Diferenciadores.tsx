type Diferenciador = {
  src: string;
  alt: string;
  texto: string;
  destacado: string;
};

const diferenciadores: Diferenciador[] = [
  {
    src: "/web/iconodeferenciador1.webp",
    alt: "Merchandising",
    texto: "Más de 10 mil productos para",
    destacado: "merchandising",
  },
  {
    src: "/web/iconodeferenciador2.webp",
    alt: "Pagos Seguros",
    texto: "Pagos y envíos",
    destacado: "seguros",
  },
  {
    src: "/web/iconodeferenciador3.webp",
    alt: "Garantía",
    texto: "Proveedores de",
    destacado: "garantía",
  },
];

export default function Diferenciadores() {
  return (
    <section className="mx-3 mb-12 overflow-hidden rounded-[2rem] bg-ink text-white md:rounded-[2.5rem]">
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:px-8">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-panel" />
            100% personalizable
          </span>
          <p className="mt-5 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            Todos nuestros artículos son personalizables para incluir el logotipo
            de tu empresa, tu eslogan, los nombres de tus empleados, clientes,
            socios u otra personalización.
          </p>
        </div>

        <div className="relative grid gap-4 sm:grid-cols-3">
          {diferenciadores.map((d) => (
            <div
              key={d.alt}
              className="flex flex-col items-center gap-4 rounded-[1.5rem] bg-white/5 p-6 text-center ring-1 ring-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="size-20" src={d.src} alt={d.alt} />
              <p className="text-base leading-relaxed text-white/75">
                {d.texto} <span className="font-semibold text-white">{d.destacado}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
