type Diferenciador = {
  src: string;
  alt: string;
  text: string;
};

const diferenciadores: Diferenciador[] = [
  {
    src: "/web/iconodeferenciador1.webp",
    alt: "Merchandising",
    text: 'Más de 10 mil productos para <span class="font-bold">merchandising</span>',
  },
  {
    src: "/web/iconodeferenciador2.webp",
    alt: "Pagos Seguros",
    text: 'Pagos y envíos <span class="font-bold">seguros</span>',
  },
  {
    src: "/web/iconodeferenciador3.webp",
    alt: "Garantía",
    text: 'Proveedores de <span class="font-bold">garantía</span>',
  },
];

export default function Diferenciadores() {
  return (
    <>
      {/* Sección de texto descriptivo */}
      <div className="mx-3 flex justify-center items-center rounded-[2rem] bg-ink py-8 px-6 mt-5">
        <p className="text-white text-center max-w-4xl font-normal text-lg leading-relaxed">
          Todos nuestros artículos son personalizables para incluir el logotipo
          de tu empresa, tu eslogan, los nombres de tus empleados, clientes,
          socios u otra personalización.
        </p>
      </div>

      {/* Sección de diferenciadores */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
          {diferenciadores.map((diferenciador) => (
            <div
              key={diferenciador.alt}
              className="flex flex-col items-center text-center p-8 rounded-2xl gap-5 max-w-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-full max-w-48 h-auto"
                src={diferenciador.src}
                alt={diferenciador.alt}
              />
              <p
                className="text-neutral-600 text-base md:text-lg max-w-48 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: diferenciador.text }}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
