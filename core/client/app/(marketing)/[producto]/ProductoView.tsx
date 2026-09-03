"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { submitLead } from "@/app/lib/leads";
import type { Categoria, Producto } from "@/app/api/products/data";

type ProductoViewProps = {
  catData: Categoria;
  productos: Producto[];
};

const WHATSAPP_NUMBER = "973644878";

const faqs = [
  {
    question: "¿Cómo se han fabricado tus productos?",
    answer:
      "Todos los productos de COMPIPRO, ya sean nacionales o importados están certificados y cumplen con los estándares de calidad requeridos el por estado. Cumplen con una cadena de suministros responsable, siempre pensando en los recursos naturales, su preservación y sostenibilidad a largo plazo.",
  },
  {
    question: "¿Cuánto es el tiempo de ejecución?",
    answer:
      "Los tiempos de producción, personalización y entrega varían según el producto, por factores como stock, tiempo de producción y de customización, por la variabilidad de este nuestros agentes del área comercial estarán en la capacidad de otorgar la información precisa sobre el estado de los productos y tiempos aproximados de entrega.",
  },
  {
    question: "¿Hay un cobro adicional de envío en Lima y provincia?",
    answer:
      "El incremento del costo de envió fuera de Lima Metropolitana () y/o provincias será asumida por el Cliente y se trabajará mediante una courier o empresa de Transporte de su elección.() Consultar distritos no considerados para envío dentro de Lima Metropolitana.",
  },
  {
    question: "¿Puedo hacer devolución de un producto?",
    answer:
      "Solo es posible hacer una devolución del producto en caso existan fallos en su manufactura o cambios en el diseño aprobado. La devolución se efectuará luego de 30 días hábiles y con constancia de la devolución.",
  },
  {
    question: "¿Cuáles son los métodos de pago?",
    answer:
      "Las Formas de Pago es previa emisión de la Orden de Compra y/o Servicio con un adelanto del 50% y su cancelación del 50% contra entrega. Los Métodos de Pago son mediante Deposito a la cuenta corriente, Tarjeta Crédito (Visa, MasterCard, otros).",
  },
  {
    question: "¿Cómo puedo saber el status de mi pedido?",
    answer:
      "El seguimiento del proceso se dará por parte del área comercial, en específico el vendedor que esté a cargo de tu cotización y venta.",
  },
  {
    question: "¿Cómo son sus protocolos de entrega?",
    answer:
      "Los protocolos de entrega se rigen bajo las estrictas normas de bioseguridad implementadas por el gobierno, asimismo, pedimos encarecidamente a nuestros clientes utilizar mascarilla en el momento de la entrega. No nos hacemos responsables del protocolo de entrega en caso se contrate a un agente externo para las entregas.",
  },
  {
    question: "¿Cómo puedo ponerme en contacto con ustedes?",
    answer:
      "Te puedes comunicar con nosotros mediante los siguientes teléfonos: Tel: (511) 780-4649 Celular: 946570562 Correo: ventas@compipro.net",
  },
];

type FormState = {
  empresa: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  mensaje: string;
  productoNombre: string;
};

const initialForm: FormState = {
  empresa: "",
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  mensaje: "",
  productoNombre: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20";

export default function ProductoView({ catData, productos }: ProductoViewProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const whatsappUrl = () => {
    const msg = `Hola, estoy interesado en ${
      form.productoNombre || catData.nombre
    }. Mis datos:
- Empresa: ${form.empresa}
- Nombre: ${form.nombre} ${form.apellido}
- Email: ${form.email}
- Teléfono: ${form.telefono}
- Mensaje: ${form.mensaje}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await submitLead({
        tipo: "Cotizacion",
        nombre: `${form.nombre} ${form.apellido}`.trim(),
        empresa: form.empresa || undefined,
        email: form.email || undefined,
        telefono: form.telefono || undefined,
        mensaje: form.mensaje || undefined,
        productoNombre: form.productoNombre || undefined,
        categoria: catData.nombre,
      });
      setStatus("sent");
      setForm(initialForm);
      toast.success("¡Solicitud enviada! Te contactaremos pronto.");
    } catch (error) {
      setStatus("idle");
      toast.error(error instanceof Error ? error.message : "No se pudo enviar.");
    }
  };

  const handleProductQuote = (nombre: string) => {
    setForm((prev) => ({
      ...prev,
      productoNombre: nombre,
      mensaje: `Estoy interesado en el producto: ${nombre}`,
    }));
    setStatus("idle");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-orange-50 via-white to-white">
        {/* Forma decorativa */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-stretch gap-8 px-4 pt-24 pb-16 sm:px-6 md:pt-28 md:pb-20 lg:grid-cols-2 lg:gap-10 lg:px-8">
          {/* Showcase: portada con contenido superpuesto */}
          <div className="relative flex min-h-96 flex-col justify-end overflow-hidden rounded-3xl bg-gray-900 p-8 shadow-xl ring-1 ring-gray-900/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={catData.portada}
              alt={catData.nombre}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/10" />

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur-sm">
                Catálogo Compipro
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {catData.nombre}
              </h1>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">
                {catData.descripcion}
              </p>

              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-white/90">
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-orange-300" />
                  Personalización con tu logo
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-orange-300" />
                  Cobertura a todo el Perú
                </li>
              </ul>

              <a
                href="#productos"
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                Ver {productos.length} productos
                <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Formulario de cotización */}
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-900/5 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Solicita una cotización
                </h2>
                <p className="text-xs text-gray-500">
                  {form.productoNombre
                    ? `Sobre: ${form.productoNombre}`
                    : "Un asesor comercial te responde a la brevedad"}
                </p>
              </div>
            </div>

            {status === "sent" ? (
              <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    ¡Recibimos tu solicitud!
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Nuestro equipo comercial te contactará muy pronto con la
                    cotización.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              <input
                type="text"
                name="empresa"
                placeholder="Empresa"
                value={form.empresa}
                onChange={handleChange}
                required
                className={inputClass}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
                <input
                  type="text"
                  name="apellido"
                  placeholder="Apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
              <input
                type="tel"
                name="telefono"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={handleChange}
                required
                className={inputClass}
              />
              <textarea
                name="mensaje"
                placeholder="¿Cómo podemos ayudarte?"
                value={form.mensaje}
                onChange={handleChange}
                required
                rows={4}
                className={`${inputClass} resize-y`}
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {status === "sending" ? "Enviando…" : "Enviar cotización"}
                {status === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>

              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5" />o cotiza por WhatsApp
              </a>
            </form>
            )}
          </div>
        </div>
      </section>

      {/* Descripción */}
      <section className="bg-white py-14">
        <p className="mx-auto max-w-3xl px-4 text-center text-lg leading-relaxed text-gray-500">
          Obtenga los artículos más novedosos relacionados al Merchandising y
          personalice estos productos para que pueda generar un impacto hacia sus
          colaboradores como hacia sus clientes.
        </p>
      </section>

      {/* Products Section */}
      <section id="productos" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Encabezado */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
              {catData.nombre}
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Nuestros Productos
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-500">
              {productos.length}{" "}
              {productos.length === 1
                ? "artículo disponible"
                : "artículos disponibles"}{" "}
              en esta línea, listos para personalizar con tu marca.
            </p>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-linear-to-r from-yellow-400 to-orange-500" />
          </div>

          {/* Grid de productos */}
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productos.map((producto, index) => (
              <article
                key={producto.id}
                style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
                className="animate-fade-in-up group flex flex-col overflow-hidden rounded-2xl bg-white text-center shadow-sm ring-1 ring-gray-900/5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:ring-orange-300/60"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors duration-300 group-hover:text-orange-600">
                    {producto.nombre}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                    {producto.descripcion}
                  </p>

                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={() => handleProductQuote(producto.nombre)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-linear-to-r from-orange-500 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Cotizar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
              Ayuda
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Preguntas Frecuentes
            </h2>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-linear-to-r from-yellow-400 to-orange-500" />
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => {
              const isActive = openFaq === index;
              return (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-900/5 transition-shadow duration-300 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isActive}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 sm:text-lg"
                  >
                    {faq.question}
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-orange-500 transition-transform duration-300 ${
                        isActive ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid overflow-hidden transition-all duration-300 ease-out ${
                      isActive
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-gray-600">
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
    </>
  );
}
