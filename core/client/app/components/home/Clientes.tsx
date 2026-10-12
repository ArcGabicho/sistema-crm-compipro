type Cliente = {
  src: string;
  alt: string;
};

const clientes: Cliente[] = [
  { src: "/web/imagencliente1.svg", alt: "Logo de Depsa" },
  { src: "/web/imagencliente2.svg", alt: "Logo de EFC" },
  { src: "/web/imagencliente3.svg", alt: "Logo de Mary Kay" },
  { src: "/web/imagencliente4.svg", alt: "Logo de Ransa" },
  { src: "/web/imagencliente5.svg", alt: "Logo de Sacyr" },
  { src: "/web/imagencliente6.svg", alt: "Logo de Sanmarco" },
  { src: "/web/imagencliente7.svg", alt: "Logo de Statkraft" },
  { src: "/web/imagencliente8.svg", alt: "Logo de SGI" },
];

// Se duplica la lista para lograr un loop infinito sin cortes.
const loopClientes = [...clientes, ...clientes];

export default function Clientes() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
          Confían en nosotros
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Nuestros clientes
        </h2>
        <div className="mx-auto mt-6 h-1.5 w-16 rounded-full hatch-accent" />
      </div>

      {/* Slider infinito */}
      <div className="group relative mt-12 overflow-hidden rounded-[1.75rem] bg-panel py-6 shadow-sm ring-1 ring-white">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-panel to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-panel to-transparent" />

        <div className="flex animate-scroll group-hover:[animation-play-state:paused]">
          {loopClientes.map((cliente, index) => (
            <div
              key={`${cliente.alt}-${index}`}
              className="mx-4 flex h-20 w-32 shrink-0 items-center justify-center grayscale transition-all duration-500 hover:grayscale-0 md:h-24 md:w-40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cliente.src}
                alt={index < clientes.length ? cliente.alt : ""}
                className="max-h-full max-w-full object-contain opacity-60 transition-opacity duration-500 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
