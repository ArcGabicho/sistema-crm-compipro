import type { Metadata } from "next";
import { metaPagina } from "@/app/lib/site";
import Hero from "../../components/about/Hero";
import Valores from "../../components/about/Valores";
import Acordeon from "../../components/about/Acordeon";
import Cta from "../../components/shared/Cta";

export const metadata: Metadata = metaPagina({
  path: "/nosotros",
  title: "Nosotros",
  description:
    "Conoce a Compipro: empresa peruana de merchandising con más de 5 años de experiencia, infraestructura propia y partners estratégicos a nivel nacional e internacional.",
});

export default function NosotrosPage() {
  return (
    <>
      <Hero />
      <Valores />
      <Acordeon />
      <Cta
        title="¿Listo para potenciar tu marca?"
        description="Cuéntanos qué necesitas y te ayudamos a elegir los artículos ideales para tu empresa, con entrega en todo el Perú."
      />
    </>
  );
}
