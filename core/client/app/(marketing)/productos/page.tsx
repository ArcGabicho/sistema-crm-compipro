import type { Metadata } from "next";
import Hero from "../../components/products/Hero";
import Catalogo from "../../components/products/Catalogo";
import Cta from "../../components/products/Cta";

export const metadata: Metadata = {
  title: "Productos | Compipro S.A.C.",
};

export default function ProductosPage() {
  return (
    <>
      <Hero />
      <Catalogo />
      <Cta />
    </>
  );
}
