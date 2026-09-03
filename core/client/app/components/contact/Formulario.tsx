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

  return (
    <section className="bg-gray-50 py-16 px-4 flex items-center flex-col justify-center">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold text-gray-800 mb-3">
          POTENCIAMOS TU CRECIMIENTO
        </h2>
        <div className="w-16 h-0.5 bg-linear-to-r from-amber-400 to-amber-600 mx-auto rounded-full" />
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-6xl w-full flex flex-col lg:flex-row relative">
        {/* Decorative amber background */}
        <div className="absolute top-0 right-0 w-1/5 h-full bg-linear-to-br from-amber-500/90 to-amber-600/90 rounded-r-2xl hidden lg:block" />

        {/* Form section */}
        <div className="p-8 bg-white/90 backdrop-blur-sm rounded-l-2xl flex-1 relative z-10">
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-gray-800 mb-2">
              ¿Solicita una <span className="text-emerald-600">cotización</span>?
            </h4>
            <p className="text-gray-600 text-sm flex items-center gap-2">
              <Mail size={14} />
              Contacta con nosotros en{" "}
              <a
                href="mailto:ventas@compipro.net"
                className="text-amber-600 hover:text-amber-700 font-medium transition-colors duration-200"
              >
                ventas@compipro.net
              </a>
            </p>
          </div>

          {status === "sent" ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  ¡Recibimos tu solicitud!
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Un asesor comercial de Compipro se pondrá en contacto contigo a
                  la brevedad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre de contacto"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 pl-9 text-sm bg-gray-50/50 focus:bg-white"
                  required
                />
                <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="calle"
                  value={formData.calle}
                  onChange={handleInputChange}
                  placeholder="Calle"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 pl-9 text-sm bg-gray-50/50 focus:bg-white"
                />
                <MapPin
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    placeholder="Ciudad"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 pl-9 text-sm bg-gray-50/50 focus:bg-white"
                  />
                  <MapPin
                    size={16}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleInputChange}
                    placeholder="Código postal"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-sm bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Teléfono de contacto"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-sm bg-gray-50/50 focus:bg-white"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  placeholder="Correo electrónico"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 pl-9 text-sm bg-gray-50/50 focus:bg-white"
                  required
                />
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>

              <div className="relative">
                <textarea
                  name="idea"
                  value={formData.idea}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Háblenos de su idea (producto, cantidad, técnica, fecha)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 pl-9 text-sm resize-none bg-gray-50/50 focus:bg-white"
                  required
                />
                <FileText
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-300/50 text-sm disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {status === "sending" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {status === "sending" ? "ENVIANDO…" : "ENVIAR COTIZACIÓN"}
              </button>

              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <MessageCircle size={14} />o escríbenos por WhatsApp
              </a>
            </form>
          )}
        </div>

        {/* Map section */}
        <div className="flex-1 relative lg:pr-8 lg:py-8 p-4">
          <div className="w-full h-80 lg:h-full rounded-lg lg:rounded-r-2xl overflow-hidden shadow-md border border-gray-100">
            <iframe
              title="Ubicación Compipro"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d975.7269537248984!2d-76.95927815022243!3d-12.016348448532601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c60cf36f8e9b%3A0x3f232688d4085c1b!2sAv.%20Las%20Flores%20de%20Primavera%20184%2C%20San%20Juan%20de%20Lurigancho%2C%20Per%C3%BA!5e0!3m2!1ses-419!2s!4v1708000000000!5m2!1ses-419!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg lg:rounded-r-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Formulario;
