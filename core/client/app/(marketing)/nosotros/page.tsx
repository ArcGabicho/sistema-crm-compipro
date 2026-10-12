import type { Metadata } from "next";
import Hero from "../../components/about/Hero";
import Valores from "../../components/about/Valores";
import Acordeon from "../../components/about/Acordeon";
import Cta from "../../components/shared/Cta";

export const metadata: Metadata = {
  title: "Nosotros | Compipro S.A.C.",
};

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
