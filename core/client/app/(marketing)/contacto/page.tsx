import type { Metadata } from "next";
import { metaPagina } from "@/app/lib/site";
import Hero from "../../components/contact/Hero";
import Formulario from "../../components/contact/Formulario";

export const metadata: Metadata = metaPagina({
  path: "/contacto",
  title: "Contacto",
  description:
    "Solicita una cotización de merchandising: llámanos al (51) 932 230 880, escríbenos a ventas@compipro.net o visítanos en San Juan de Lurigancho, Lima.",
});

export default function ContactoPage() {
  return (
    <>
      <Hero />
      <Formulario />
    </>
  );
}
