"use client";

import { useState } from "react";
import {
  Send,
  MapPin,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  Loader2,
  MessageCircle,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { submitLead } from "@/app/lib/leads";

type FormData = {
  nombre: string;
  calle: string;
  ciudad: string;
  codigoPostal: string;
  telefono: string;
  correo: string;
  idea: string;
};

const initialFormData: FormData = {
  nombre: "",
  calle: "",
  ciudad: "",
  codigoPostal: "",
  telefono: "",
  correo: "",
  idea: "",
};

const WHATSAPP_NUMBER = "51973644878";

const Formulario = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const whatsappUrl = () => {
    const mensaje = `Hola, me gustaría solicitar una cotización. Estos son mis datos:
- Nombre de contacto: ${formData.nombre}
- Dirección: ${formData.calle}, ${formData.ciudad} ${formData.codigoPostal}
- Teléfono: ${formData.telefono}
- Correo: ${formData.correo}
- Idea: ${formData.idea}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await submitLead({
        tipo: "Cotizacion",
        nombre: formData.nombre,
        email: formData.correo || undefined,
        telefono: formData.telefono || undefined,
        mensaje: formData.idea || undefined,
        direccion: formData.calle || undefined,
        ciudad: formData.ciudad || undefined,
        codigoPostal: formData.codigoPostal || undefined,
      });
      setStatus("sent");
      setFormData(initialFormData);
      toast.success("¡Solicitud enviada! Te contactaremos pronto.");
    } catch (error) {
      setStatus("idle");
      toast.error(
        error instanceof Error ? error.message : "No se pudo enviar.",
      );
    }
  };

  const inputCls =
    "w-full rounded-full bg-white px-5 py-3 text-sm text-ink shadow-sm ring-1 ring-neutral-200 placeholder:text-neutral-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-accent";
  const iconCls = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400";

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Formulario */}
        <div className="rounded-[1.75rem] bg-panel p-6 shadow-sm ring-1 ring-white sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
            Cotización
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            ¿Solicitas una cotización?
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <Mail size={14} />
            También puedes escribirnos a
            <a
              href="mailto:ventas@compipro.net"
              className="font-semibold text-orange-600 transition-colors hover:text-orange-700"
            >
              ventas@compipro.net
            </a>
          </p>

          {status === "sent" ? (
            <div className="mt-6 flex flex-col items-center gap-4 rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-emerald-200">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <div>
                <p className="text-lg font-semibold text-ink">
                  ¡Recibimos tu solicitud!
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Un asesor comercial de Compipro se pondrá en contacto contigo a
                  la brevedad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre de contacto"
                  className={`${inputCls} pl-11`}
                  required
                />
                <User size={16} className={iconCls} />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="calle"
                  value={formData.calle}
                  onChange={handleInputChange}
                  placeholder="Calle"
                  className={`${inputCls} pl-11`}
                />
                <MapPin size={16} className={iconCls} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    placeholder="Ciudad"
                    className={`${inputCls} pl-11`}
                  />
                  <MapPin size={16} className={iconCls} />
                </div>
                <input
                  type="text"
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleInputChange}
                  placeholder="Código postal"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Teléfono de contacto"
                    className={`${inputCls} pl-11`}
                    required
                  />
                  <Phone size={16} className={iconCls} />
                </div>
                <div className="relative">
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    placeholder="Correo electrónico"
                    className={`${inputCls} pl-11`}
                    required
                  />
                  <Mail size={16} className={iconCls} />
                </div>
              </div>

              <div className="relative">
                <textarea
                  name="idea"
                  value={formData.idea}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Háblenos de su idea (producto, cantidad, técnica, fecha)"
                  className={`${inputCls} resize-none rounded-[1.5rem] pl-11`}
                  required
                />
                <FileText size={16} className="pointer-events-none absolute left-4 top-3.5 text-neutral-400" />
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {status === "sending" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {status === "sending" ? "Enviando…" : "Enviar cotización"}
                </button>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
                >
                  <MessageCircle size={16} />
                  Enviar por WhatsApp
                </a>
              </div>
            </form>
          )}
        </div>

        {/* Mapa */}
        <div className="flex min-h-80 flex-col overflow-hidden rounded-[1.75rem] bg-panel p-2 shadow-sm ring-1 ring-white">
          <div className="relative flex-1 overflow-hidden rounded-[1.4rem] bg-frame">
            <iframe
              title="Ubicación Compipro"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d975.7269537248984!2d-76.95927815022243!3d-12.016348448532601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c60cf36f8e9b%3A0x3f232688d4085c1b!2sAv.%20Las%20Flores%20de%20Primavera%20184%2C%20San%20Juan%20de%20Lurigancho%2C%20Per%C3%BA!5e0!3m2!1ses-419!2s!4v1708000000000!5m2!1ses-419!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <div className="flex items-center gap-3 px-3 pb-2 pt-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white">
              <MapPin size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Nuestra oficina</p>
              <p className="truncate text-xs text-neutral-500">
                Av. Las Flores de Primavera 184, San Juan de Lurigancho
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Formulario;
