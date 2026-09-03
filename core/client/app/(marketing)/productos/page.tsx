import type { Metadata } from "next";
import Hero from "../../components/products/Hero";
import Cards from "../../components/products/Cards";

export const metadata: Metadata = {
  title: "Productos | Compipro S.A.C.",
};

export default function ProductosPage() {
  return (
    <>
      <Hero />
      <Cards />
    </>
  );
}
