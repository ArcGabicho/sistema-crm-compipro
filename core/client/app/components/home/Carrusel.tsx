import { ArrowUpRight, LayoutGrid } from "lucide-react";

type Proyecto = {
  id: number;
  title: string;
  description: string;
  image: string;
};

const proyectos: Proyecto[] = [
  {
    id: 1,
    title: "Product Design",
    description: "UI/UX, Design",
    image: "/web/imagencarrusel1.webp",
  },
  {
    id: 2,
    title: "Custom Website",
    description: "UI/UX, Design",
    image: "/web/imagencarrusel2.webp",
  },
  {
    id: 3,
    title: "Digital Marketing",
    description: "UI/UX, Design",
    image: "/web/imagencarrusel3.webp",
  },
  {
    id: 4,
    title: "Branding",
    description: "Marketing, Identity",
    image: "/web/imagencarrusel4.webp",
  },
  {
    id: 5,
    title: "App Design",
    description: "Mobile, UI",
    image: "/web/imagencarrusel5.webp",
  },
  {
    id: 6,
    title: "SEO Strategy",
    description: "Optimization, Growth",
    image: "/web/imagencarrusel6.webp",
  },
];

export default function Carrusel() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
      {/* Encabezado */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <LayoutGrid className="h-3.5 w-3.5" />
          Portafolio
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Proyectos Desarrollados
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-500">
          Una muestra de los trabajos que hemos realizado para marcas de
          distintos sectores.
        </p>
        <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-linear-to-r from-amber-400 to-orange-500" />
      </div>

      {/* Grid de proyectos */}
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        {proyectos.map((proyecto, index) => (
          <article
            key={proyecto.id}
            style={{ animationDelay: `${index * 80}ms` }}
            className="animate-fade-in-up group relative flex aspect-4/3 flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 shadow-sm ring-1 ring-gray-900/5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:ring-amber-300/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proyecto.image}
              alt={proyecto.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

            {/* Contenido superpuesto */}
            <div className="relative p-5 text-left">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {proyecto.description.split(",").map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
              <h3 className="flex items-center gap-1.5 text-lg font-bold text-white">
                {proyecto.title}
                <ArrowUpRight className="h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
