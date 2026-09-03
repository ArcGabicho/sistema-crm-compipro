import Hero from "@/app/components/shared/Hero";
import Productos from "@/app/components/shared/Productos";
import Valores from "@/app/components/home/Valores";
import Clientes from "@/app/components/home/Clientes";
import Carrusel from "@/app/components/home/Carrusel";
import Diferenciadores from "@/app/components/home/Diferenciadores";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Productos />
      <Valores />
      <Clientes />
      <Carrusel />
      <Diferenciadores />
    </>
  );
}
