"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Faq = {
  question: string;
  answer: string;
};

const faqsData: Faq[] = [
  {
    question: "¿Qué servicios ofrece Compipro S.A.C.?",
    answer:
      "Ofrecemos soluciones integrales de tecnología, incluyendo desarrollo de software, consultoría IT y servicios de transformación digital.",
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full py-15 bg-frame flex justify-center items-center">
      <div className="max-w-7xl w-full mx-auto px-4">
        <h2 className="text-center mb-10 text-3xl sm:text-4xl text-ink">
          Preguntas Frecuentes
        </h2>
        <div className="max-w-4xl mx-auto w-full">
          {faqsData.map((faq, index) => (
            <div
              key={faq.question}
              className="bg-panel rounded-2xl mb-4 shadow-md overflow-hidden transition-all duration-300 ease-in-out"
            >
              <button
                type="button"
                className="w-full flex justify-between items-center py-4 px-5 bg-frame cursor-pointer transition-colors duration-300 hover:bg-white text-left"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <h3 className="m-0 text-lg text-ink font-medium">
                  {faq.question}
                </h3>
                <span className="text-neutral-600 transition-transform duration-300">
                  {openIndex === index ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} />
                  )}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-panel ${
                  openIndex === index
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="py-4 px-5">
                  <p className="m-0 text-neutral-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Acordeon;
