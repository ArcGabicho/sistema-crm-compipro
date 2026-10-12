import type { Metadata } from "next";
import { metaPagina } from "@/app/lib/site";
import Hero from "../../components/catalog/Hero";
import Lineas from "../../components/catalog/Lineas";
import Cta from "../../components/shared/Cta";

export const metadata: Metadata = metaPagina({
  path: "/catalogo",
  title: "Catálogo",
  description:
    "26 líneas de merchandising: tecnológicos, ecológicos, imprenta, textil, packs corporativos y más. Elige tu línea y cotiza con Compipro.",
});

export default function CatalogoPage() {
  return (
    <>
      <Hero />
      <Lineas />
      <Cta />
    </>
  );
}
