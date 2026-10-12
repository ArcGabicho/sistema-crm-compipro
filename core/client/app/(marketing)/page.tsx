import type { Metadata } from "next";
import { EMPRESA, metaPagina } from "@/app/lib/site";
import Hero from "@/app/components/shared/Hero";
import Productos from "@/app/components/shared/Productos";
import Valores from "@/app/components/home/Valores";
import Clientes from "@/app/components/home/Clientes";
import Carrusel from "@/app/components/home/Carrusel";
import Diferenciadores from "@/app/components/home/Diferenciadores";
import Cta from "@/app/components/shared/Cta";

export const metadata: Metadata = {
  ...metaPagina({
    path: "/",
    title: "Agencia de merchandising en Perú",
    description: EMPRESA.descripcion,
  }),
  title: { absolute: "Compipro S.A.C. | Agencia de merchandising en Perú" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Productos />
      <Valores />
      <Clientes />
      <Carrusel />
      <Diferenciadores />
      <Cta
        title="Cotiza tu próximo pedido"
        description="Cuéntanos qué necesitas y te ayudamos a elegir los artículos ideales para tu marca, con entrega en todo el Perú."
      />
    </>
  );
}
