"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

type Faq = {
  question: string;
  answer: string;
};

const faqsData: Faq[] = [
  {
    question: "¿Qué servicios ofrece Compipro S.A.C.?",
    answer:
      "Ofrecemos artículos y productos publicitarios de alta calidad y diseño para eventos, ferias, regalos corporativos y la industria en general, personalizados con la identidad de tu marca.",
  },
  {
    question: "¿Cómo trabajan con sus clientes?",
    answer:
      "Nos enfocamos en un enfoque personalizado, colaborativo y centrado en las necesidades específicas de cada cliente.",
  },
  {
    question: "¿Cuál es su área de cobertura?",
    answer:
      "Trabajamos a nivel nacional, con capacidad para atender proyectos en diferentes regiones y sectores.",
  },
  {
    question: "¿Cuánto tiempo llevan en el mercado?",
    answer:
      "Contamos con más de 5 años de experiencia, ofreciendo soluciones innovadoras a empresas de diversos sectores.",
  },
  {
    question: "¿Cómo puedo solicitar una cotización?",
    answer:
      "Puede contactarnos a través de nuestro formulario web, correo electrónico o número telefónico. Nos pondremos en contacto a la brevedad.",
  },
];

const Acordeon = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:pb-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        {/* Introducción */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
            Ayuda
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-3 text-base leading-relaxed text-neutral-500">
            Aquí encontrarás respuestas a las preguntas más comunes sobre
            nuestros servicios y empresa. Si no encuentras lo que buscas, no
            dudes en contactarnos.
          </p>

          <div className="mt-6 overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/web/FAQs.jpg"
              alt="Preguntas frecuentes sobre Compipro"
              className="h-56 w-full object-contain p-4"
            />
          </div>

          <Link
            href="/contacto"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
          >
            ¿Otra duda? Escríbenos
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Acordeón */}
        <div className="space-y-3 lg:pt-14">
          {faqsData.map((faq, index) => {
            const open = openIndex === index;
            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-[1.5rem] bg-panel shadow-sm ring-1 transition-all duration-300 ${
                  open ? "ring-accent/50" : "ring-white"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-300 hover:bg-white/60"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={open}
                >
                  <h3 className="text-base font-medium text-ink">
                    {faq.question}
                  </h3>
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                      open ? "rotate-180 bg-ink text-white" : "bg-white text-neutral-600"
                    }`}
                  >
                    <ChevronDown className="size-4" />
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-neutral-600">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Acordeon;
