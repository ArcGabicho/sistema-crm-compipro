import type { Metadata } from "next";
import Hero from "../../components/shared/Hero";
import Formulario from "../../components/contact/Formulario";

export const metadata: Metadata = {
  title: "Contacto | Compipro S.A.C.",
};

export default function ContactoPage() {
  return (
    <>
      <Hero />
      <Formulario />
    </>
  );
}
