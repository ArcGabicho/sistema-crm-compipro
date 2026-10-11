type Cliente = {
  src: string;
  alt: string;
};

const clientes: Cliente[] = [
  { src: "/web/imagencliente1.svg", alt: "Cliente 1" },
  { src: "/web/imagencliente2.svg", alt: "Cliente 2" },
  { src: "/web/imagencliente3.svg", alt: "Cliente 3" },
  { src: "/web/imagencliente4.svg", alt: "Cliente 4" },
  { src: "/web/imagencliente5.svg", alt: "Cliente 5" },
  { src: "/web/imagencliente6.svg", alt: "Cliente 6" },
  { src: "/web/imagencliente7.svg", alt: "Cliente 7" },
  { src: "/web/imagencliente8.svg", alt: "Cliente 8" },
];

// Se duplica la lista para lograr un loop infinito sin cortes.
const loopClientes = [...clientes, ...clientes];

export default function Clientes() {
  return (
    <div className="max-w-7xl mx-auto px-4 text-center py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-ink mb-12">
        NUESTROS CLIENTES
      </h2>

      {/* Slider infinito */}
      <div className="group relative overflow-hidden w-full h-24 md:h-32">
        {/* Gradiente para fade effect */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-linear-to-r from-frame via-transparent to-frame" />

        {/* Contenedor del slider */}
        <div className="flex animate-scroll group-hover:[animation-play-state:paused]">
          {loopClientes.map((cliente, index) => (
            <div
              key={`${cliente.alt}-${index}`}
              className="shrink-0 w-32 md:w-40 h-24 md:h-32 flex items-center justify-center mx-4 grayscale hover:grayscale-0 transition-all duration-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cliente.src}
                alt={cliente.alt}
                className="max-w-full max-h-full object-contain opacity-60 hover:opacity-100 transition-opacity duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
