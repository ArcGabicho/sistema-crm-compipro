"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FlaskConical, LoaderCircle, Send, X } from "lucide-react";
import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, estadoTone } from "@/app/components/dashboard/cells";
import { crm } from "@/app/lib/crm";
import { useAuth } from "@/app/hooks/useAuth";

type Campana = {
  id: number;
  nombre: string;
  estado: string;
  programadaPara: string | null;
  destinatarios: number;
  enviados: number;
  aperturas: number;
  clicks: number;
  plantilla?: { nombre: string } | null;
};

type Plantilla = {
  id: number;
  nombre: string;
  asunto: string;
  cuerpoHtml: string;
  updatedAt: string | null;
  createdAt: string;
};

type EstadoEmail = { real: boolean; remitente: string; seguimiento: boolean };

type ResultadoEnvio = { reales: number; simulados: number; fallidos: number };

const ESTADOS = ["Borrador", "Programada", "Enviada"].map((v) => ({ value: v, label: v }));

const pct = (n: number, de: number) => (de ? `${n} (${Math.round((n / de) * 100)}%)` : "—");

const fechaHora = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })
    : "—";

function resumen({ reales, simulados, fallidos }: ResultadoEnvio): string {
  const partes = [];
  if (reales) partes.push(`${reales} enviado${reales === 1 ? "" : "s"}`);
  if (simulados) partes.push(`${simulados} simulado${simulados === 1 ? "" : "s"}`);
  if (fallidos) partes.push(`${fallidos} con error`);
  return partes.join(" · ") || "Sin destinatarios";
}

export default function EmailPage() {
  const [tab, setTab] = useState<"campanas" | "plantillas">("campanas");
  const [estado, setEstado] = useState<EstadoEmail | null>(null);
  const [prueba, setPrueba] = useState<Campana | null>(null);

  useEffect(() => {
    crm.consulta<EstadoEmail>("email/estado").then(setEstado).catch(() => setEstado(null));
  }, []);

  const campanas: ResourceConfig<Campana> = {
    resource: "campanas-email",
    title: "Programar · Enviar Email",
    subtitle: "Campañas a los clientes activos con email: envío inmediato o programado.",
    searchPlaceholder: "Buscar campaña…",
    filters: [{ name: "estado", label: "Estado", options: ESTADOS }],
    columns: [
      { key: "nombre", label: "Campaña", className: "font-medium text-ink" },
      { key: "plantilla", label: "Plantilla", render: (r) => r.plantilla?.nombre ?? "—" },
      {
        key: "estado",
        label: "Estado",
        render: (r) => (
          <span className="flex flex-col items-start gap-0.5">
            {badge(r.estado, estadoTone(r.estado))}
            {r.estado === "Programada" && (
              <span className="text-[11px] text-neutral-500">{fechaHora(r.programadaPara)}</span>
            )}
          </span>
        ),
      },
      { key: "enviados", label: "Enviados" },
      { key: "aperturas", label: "Aperturas", render: (r) => pct(r.aperturas, r.enviados) },
      { key: "clicks", label: "Clics", render: (r) => pct(r.clicks, r.enviados) },
    ],
    fields: [
      { name: "nombre", label: "Nombre de la campaña", required: true },
      {
        name: "plantillaId",
        label: "Plantilla",
        optionsResource: "plantillas-email",
        optionsLabelKey: "nombre",
        required: true,
        colSpan: 1,
      },
      {
        name: "estado",
        label: "Estado",
        type: "select",
        options: ESTADOS.filter((e) => e.value !== "Enviada"),
        colSpan: 1,
      },
      {
        name: "programadaPara",
        label: "Enviar el (si está Programada)",
        type: "datetime",
      },
    ],
    rowActions: [
      {
        label: "Enviar",
        visible: (r) => r.estado !== "Enviada",
        onClick: async (r, reload) => {
          if (!window.confirm(`¿Enviar «${r.nombre}» ahora a todos los clientes activos con email?`)) return;
          const id = toast.loading("Enviando campaña…");
          try {
            const res = await crm.action<ResultadoEnvio>(`campanas-email/${r.id}/enviar`);
            toast.success(`Campaña enviada: ${resumen(res)}`, { id });
            reload();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error", { id });
          }
        },
      },
      { label: "Probar", onClick: (r) => setPrueba(r) },
    ],
  };

  const plantillas: ResourceConfig<Plantilla> = {
    resource: "plantillas-email",
    title: "Plantillas de email",
    subtitle: "Asunto y cuerpo HTML reutilizables. Variables: {{nombre}}, {{empresa}} y {{email}}.",
    searchPlaceholder: "Buscar plantilla…",
    columns: [
      { key: "nombre", label: "Plantilla", className: "font-medium text-ink" },
      { key: "asunto", label: "Asunto" },
      {
        key: "cuerpoHtml",
        label: "Vista previa",
        render: (r) => (
          <span className="line-clamp-1 max-w-xs text-neutral-500">
            {r.cuerpoHtml.replace(/<[^>]+>/g, " ")}
          </span>
        ),
      },
    ],
    fields: [
      { name: "nombre", label: "Nombre", required: true },
      { name: "asunto", label: "Asunto", required: true, placeholder: "Hola {{nombre}}, …" },
      {
        name: "cuerpoHtml",
        label: "Cuerpo (HTML)",
        type: "textarea",
        required: true,
        placeholder: "<p>Hola {{nombre}}, tenemos novedades para {{empresa}}…</p>",
      },
    ],
  };

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-panel p-1 shadow-sm ring-1 ring-white">
          {(
            [
              ["campanas", "Campañas"],
              ["plantillas", "Plantillas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                tab === value ? "bg-white font-medium text-ink shadow-sm" : "text-neutral-500 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {estado && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
              estado.real ? "bg-emerald-100 text-emerald-700" : "hatch-accent text-orange-800"
            }`}
            title={
              estado.real
                ? "Los clientes de demostración (.example) se simulan; los emails reales salen por SMTP."
                : "Configura SMTP en el backend para enviar correos reales."
            }
          >
            {estado.real ? <Send className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />}
            {estado.real
              ? `Envío real desde ${estado.remitente}${estado.seguimiento ? " · con seguimiento" : ""}`
              : "Modo simulado: los correos no salen del servidor"}
          </span>
        )}
      </div>

      <div className="lg:min-h-0 lg:flex-1">
        {tab === "campanas" ? (
          <ResourcePage key="campanas" config={campanas} />
        ) : (
          <ResourcePage key="plantillas" config={plantillas} />
        )}
      </div>

      {prueba && <PruebaModal campana={prueba} onClose={() => setPrueba(null)} />}
    </div>
  );
}

function PruebaModal({ campana, onClose }: { campana: Campana; onClose: () => void }) {
  const { user } = useAuth();
  const [para, setPara] = useState(user?.email ?? "");
  const [enviando, setEnviando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await crm.action<{ para: string; simulado: boolean }>(
        `campanas-email/${campana.id}/prueba`,
        { para },
      );
      toast.success(
        res.simulado ? `Prueba simulada para ${res.para}` : `Prueba enviada a ${res.para}`,
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar");
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.75rem] bg-panel shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200/70 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Enviar prueba</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-neutral-400 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2 p-5">
          <p className="text-sm text-neutral-500">
            Envía «{campana.nombre}» a una sola dirección para revisarla. No cuenta en las
            métricas de la campaña.
          </p>
          <input
            type="email"
            required
            autoFocus
            value={para}
            onChange={(e) => setPara(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
          >
            {enviando ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar prueba
          </button>
        </div>
      </form>
    </div>
  );
}
