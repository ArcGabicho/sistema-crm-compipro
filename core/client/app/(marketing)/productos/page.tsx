import type { Metadata } from "next";
import { metaPagina } from "@/app/lib/site";
import Hero from "../../components/products/Hero";
import Catalogo from "../../components/products/Catalogo";
import Cta from "../../components/shared/Cta";

export const metadata: Metadata = metaPagina({
  path: "/productos",
  title: "Productos",
  description:
    "Explora más de 300 artículos promocionales listos para personalizar con tu marca: tecnológicos, ecológicos, textiles, oficina y más. Cotiza por WhatsApp.",
});

export default function ProductosPage() {
  return (
    <>
      <Hero />
      <Catalogo />
      <Cta />
    </>
  );
}
