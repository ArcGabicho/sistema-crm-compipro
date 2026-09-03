import type { Metadata } from "next";
import Hero from "../../components/shared/Hero";
import Nosotros from "../../components/about/Nosotros";
import Valores from "../../components/about/Valores";
import FAQS from "../../components/about/FAQS";
import Acordeon from "../../components/about/Acordeon";

export const metadata: Metadata = {
  title: "Nosotros | Compipro S.A.C.",
};

export default function NosotrosPage() {
  return (
    <>
      <Hero />
      <Nosotros />
      <Valores />
      <FAQS />
      <Acordeon />
    </>
  );
}
