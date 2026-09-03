import type { Metadata } from "next";
import Hero from "../../components/catalog/Hero";
import Productos from "../../components/shared/Productos";

export const metadata: Metadata = {
  title: "Catálogo | Compipro S.A.C.",
};

export default function CatalogoPage() {
  return (
    <>
      <Hero />
      <Productos />
    </>
  );
}