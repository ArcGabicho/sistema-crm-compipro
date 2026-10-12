import { LayoutGrid } from "lucide-react";

type Proyecto = {
  id: number;
  title: string;
  tags: string[];
  image: string;
};

const proyectos: Proyecto[] = [
  { id: 1, title: "Kit corporativo", tags: ["Libretas", "Tazas"], image: "/web/imagencarrusel1.webp" },
  { id: 2, title: "Tomatodos personalizados", tags: ["Botellas", "Logo"], image: "/web/imagencarrusel2.webp" },
  { id: 3, title: "Tarjeta y caja navideña", tags: ["Imprenta", "Navidad"], image: "/web/imagencarrusel3.webp" },
  { id: 4, title: "Bolsa y lapiceros", tags: ["Textil", "Escritura"], image: "/web/imagencarrusel4.webp" },
  { id: 5, title: "Juego de mesa educativo", tags: ["Lúdicos", "Imprenta"], image: "/web/imagencarrusel5.webp" },
  { id: 6, title: "Libreta corporativa", tags: ["Cuadernos", "Accesorios"], image: "/web/imagencarrusel6.webp" },
  { id: 7, title: "Kit para eventos", tags: ["Botellas", "Lanyards"], image: "/web/imagencarrusel7.webp" },
  { id: 8, title: "Lapiceros ecológicos", tags: ["Ecológicos", "Escritura"], image: "/web/imagencarrusel8.webp" },
  { id: 9, title: "Pack de regalo", tags: ["Bolsas", "Empaque"], image: "/web/imagencarrusel9.webp" },
];

export default function Carrusel() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:pb-24">
      {/* Encabezado */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
          <LayoutGrid className="h-3.5 w-3.5" />
          Portafolio
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Proyectos desarrollados
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-500">
          Una muestra de los trabajos que hemos realizado para marcas de
          distintos sectores.
        </p>
        <div className="mx-auto mt-6 h-1.5 w-16 rounded-full hatch-accent" />
      </div>

      {/* Grid de proyectos */}
      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {proyectos.map((proyecto, index) => (
          <article
            key={proyecto.id}
            style={{ animationDelay: `${index * 60}ms` }}
            className="animate-fade-in-up group flex flex-col overflow-hidden rounded-[1.75rem] bg-panel p-2 shadow-sm ring-1 ring-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:ring-accent/50"
          >
            <div className="aspect-4/3 overflow-hidden rounded-[1.4rem] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proyecto.image}
                alt={proyecto.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-4">
              <h3 className="truncate text-base font-semibold text-ink">
                {proyecto.title}
              </h3>
              <div className="flex shrink-0 gap-1.5">
                {proyecto.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-frame px-2.5 py-0.5 text-[11px] font-medium text-neutral-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
