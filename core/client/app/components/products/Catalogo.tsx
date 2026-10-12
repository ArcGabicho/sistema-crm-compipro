"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, MessageCircle, Search, X } from "lucide-react";
import { categorias } from "@/app/api/products/data";

const WHATSAPP_URL = "https://wa.me/973644878";
const PAGE_SIZE = 12;
const CHIPS_VISIBLES = 8;

type Item = {
  id: string;
  imagen: string;
  nombre: string;
  descripcion: string;
  linea: string;
  lineaId: string;
};

const quitarAcentos = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const etiqueta = (nombre: string) =>
  nombre.replace(/^(Artículos de |Artículos |Productos )/, "");

const items: Item[] = categorias.flatMap((c) =>
  c.productos.map((p) => ({ ...p, linea: c.nombre, lineaId: c.id })),
);

const sinDuplicados = (lista: Item[]) => {
  const vistos = new Set<string>();
  return lista.filter((p) => !vistos.has(p.id) && vistos.add(p.id));
};

const totalGeneral = sinDuplicados(items).length;

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState("");
  const [linea, setLinea] = useState("");
  const [limite, setLimite] = useState(PAGE_SIZE);
  const [todasLasLineas, setTodasLasLineas] = useState(false);

  const filtrados = useMemo(() => {
    const q = quitarAcentos(busqueda.trim());
    const base = linea ? items.filter((p) => p.lineaId === linea) : sinDuplicados(items);
    if (!q) return base;
    return base.filter((p) =>
      quitarAcentos(`${p.nombre} ${p.descripcion}`).includes(q),
    );
  }, [busqueda, linea]);

  const chips = todasLasLineas ? categorias : categorias.slice(0, CHIPS_VISIBLES);
  const visibles = filtrados.slice(0, limite);
  const hayFiltros = busqueda !== "" || linea !== "";

  const elegirLinea = (id: string) => {
    setLinea(id);
    setLimite(PAGE_SIZE);
  };

  const limpiar = () => {
    setBusqueda("");
    setLinea("");
    setLimite(PAGE_SIZE);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
      {/* Encabezado */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
          Catálogo completo
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Todos nuestros productos
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-500">
          Busca por nombre o filtra por línea y cotiza el artículo que necesitas
          con la identidad de tu marca.
        </p>
        <div className="mx-auto mt-6 h-1.5 w-16 rounded-full hatch-accent" />
      </div>

      {/* Herramientas */}
      <div className="mt-12 space-y-4">
        <div className="relative mx-auto max-w-xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setLimite(PAGE_SIZE);
            }}
            placeholder="Buscar productos…"
            aria-label="Buscar productos"
            className="w-full rounded-full bg-panel py-3 pl-12 pr-5 text-sm text-ink shadow-sm ring-1 ring-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => elegirLinea("")}
            aria-pressed={linea === ""}
            className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-white transition-colors ${
              linea === ""
                ? "bg-ink text-white"
                : "bg-panel text-neutral-600 hover:bg-white hover:text-ink"
            }`}
          >
            Todas
            <span className="ml-1.5 text-xs opacity-60">{totalGeneral}</span>
          </button>
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => elegirLinea(c.id)}
              aria-pressed={linea === c.id}
              className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-white transition-colors ${
                linea === c.id
                  ? "bg-ink text-white"
                  : "bg-panel text-neutral-600 hover:bg-white hover:text-ink"
              }`}
            >
              {etiqueta(c.nombre)}
              <span className="ml-1.5 text-xs opacity-60">
                {c.productos.length}
              </span>
            </button>
          ))}
          {categorias.length > CHIPS_VISIBLES && (
            <button
              type="button"
              onClick={() => setTodasLasLineas((v) => !v)}
              aria-expanded={todasLasLineas}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-accent/15"
            >
              {todasLasLineas
                ? "Ver menos"
                : `+${categorias.length - CHIPS_VISIBLES} líneas`}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  todasLasLineas ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 text-sm text-neutral-500" aria-live="polite">
          <span>
            {filtrados.length === 0
              ? "Sin resultados"
              : `Mostrando ${visibles.length} de ${filtrados.length} productos`}
          </span>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="inline-flex items-center gap-1 rounded-full bg-panel px-3 py-1 text-xs font-semibold text-ink shadow-sm ring-1 ring-white transition-colors hover:bg-white"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtrados.length === 0 ? (
        <div className="mx-auto mt-12 max-w-md rounded-[1.75rem] bg-panel p-8 text-center shadow-sm ring-1 ring-white">
          <p className="text-base font-semibold text-ink">
            No encontramos productos con esa búsqueda
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Prueba con otra palabra o cuéntanos qué necesitas y lo conseguimos.
          </p>
          <Link
            href="/contacto"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:brightness-95"
          >
            Solicitar cotización
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          {visibles.map((p) => (
            <article
              key={`${p.lineaId}-${p.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl bg-panel text-center shadow-sm ring-1 ring-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:ring-accent/50"
            >
              <div className="relative aspect-square overflow-hidden bg-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imagen}
                  alt={p.nombre}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-4">
                <Link
                  href={`/${p.lineaId}`}
                  className="mx-auto max-w-full truncate rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-600 transition-colors hover:bg-accent hover:text-white"
                >
                  {etiqueta(p.linea)}
                </Link>
                <h3 className="mt-2 text-sm font-bold leading-snug text-ink transition-colors duration-300 group-hover:text-orange-600">
                  {p.nombre}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                  {p.descripcion}
                </p>

                <div className="mt-auto pt-4">
                  <a
                    href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hola, quiero cotizar: ${p.nombre}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Cotizar
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {visibles.length < filtrados.length && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setLimite((n) => n + PAGE_SIZE)}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
          >
            Ver más productos
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
