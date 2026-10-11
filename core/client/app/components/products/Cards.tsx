import { MessageCircle } from "lucide-react";

type Product = {
  id: number;
  name: string;
  description: string;
  image: string;
};

const productos: Product[] = [
  {
    id: 1,
    name: "Altavoz Bambú",
    description: "Altavoz portátil ecológico con diseño moderno.",
    image: "/content/producto1.jpg",
  },
  {
    id: 2,
    name: "Power Bank",
    description: "Batería externa de alta capacidad para dispositivos.",
    image: "/content/producto2.jpg",
  },
  {
    id: 3,
    name: "Set de Escritorio",
    description: "Conjunto de portabolígrafos y organizador de escritorio.",
    image: "/content/producto3.png",
  },
  {
    id: 4,
    name: "Cuadernos con Diseño",
    description: "Cuadernos con diseño único y creativo.",
    image: "/content/producto4.jpg",
  },
  {
    id: 5,
    name: "Pack para Estudiantes",
    description: "Pack completo de útiles escolares para estudiantes.",
    image: "/content/producto5.jpg",
  },
  {
    id: 6,
    name: "Set de Gigantografias",
    description: "Conjunto de gigantografías para publicidad.",
    image: "/content/producto6.png",
  },
];

const WHATSAPP_URL = "https://wa.me/973644878";

export default function Cards() {
  return (
    <section className="bg-frame py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
            Destacados
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Productos Importados
          </h2>
          <p className="mt-3 text-base leading-relaxed text-neutral-500">
            Una selección de artículos listos para personalizar con la identidad
            de tu marca.
          </p>
          <div className="mx-auto mt-6 h-1.5 w-16 rounded-full hatch-accent" />
        </div>

        {/* Grid de productos */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {productos.map((product, index) => (
            <article
              key={product.id}
              style={{ animationDelay: `${index * 80}ms` }}
              className="animate-fade-in-up group flex flex-col overflow-hidden rounded-2xl bg-panel text-center shadow-sm ring-1 ring-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:ring-accent/50"
            >
              <div className="relative aspect-square overflow-hidden bg-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-bold text-ink transition-colors duration-300 group-hover:text-orange-600">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {product.description}
                </p>

                <div className="mt-auto pt-6">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Cotizar ahora
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
