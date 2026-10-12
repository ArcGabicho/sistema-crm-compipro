import type { Metadata } from "next";
import Hero from "../../components/catalog/Hero";
import Lineas from "../../components/catalog/Lineas";
import Cta from "../../components/shared/Cta";

export const metadata: Metadata = {
  title: "Catálogo | Compipro S.A.C.",
};

export default function CatalogoPage() {
  return (
    <>
      <Hero />
      <Lineas />
      <Cta />
    </>
  );
}
