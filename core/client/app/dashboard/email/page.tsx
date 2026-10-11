"use client";

import { toast } from "react-hot-toast";
import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, estadoTone } from "@/app/components/dashboard/cells";
import { crm } from "@/app/lib/crm";

type Campana = {
  id: number;
  nombre: string;
  estado: string;
  destinatarios: number;
  enviados: number;
  aperturas: number;
  clicks: number;
  plantilla?: { nombre: string } | null;
};

const ESTADOS = ["Borrador", "Programada", "Enviada"].map((v) => ({
  value: v,
  label: v,
}));

const config: ResourceConfig<Campana> = {
  resource: "campanas-email",
  title: "Programar · Enviar Email",
  subtitle:
    "Campañas y plantillas. El envío es simulado (métricas de apertura/clic de ejemplo).",
  searchPlaceholder: "Buscar campaña…",
  filters: [{ name: "estado", label: "Estado", options: ESTADOS }],
  columns: [
    { key: "nombre", label: "Campaña", className: "font-medium text-ink" },
    {
      key: "plantilla",
      label: "Plantilla",
      render: (r) => r.plantilla?.nombre ?? "—",
    },
    {
      key: "estado",
      label: "Estado",
      render: (r) => badge(r.estado, estadoTone(r.estado)),
    },
    { key: "enviados", label: "Enviados" },
    {
      key: "aperturas",
      label: "Aperturas",
      render: (r) =>
        r.enviados ? `${r.aperturas} (${Math.round((r.aperturas / r.enviados) * 100)}%)` : "—",
    },
    {
      key: "clicks",
      label: "Clicks",
      render: (r) =>
        r.enviados ? `${r.clicks} (${Math.round((r.clicks / r.enviados) * 100)}%)` : "—",
    },
  ],
  fields: [
    { name: "nombre", label: "Nombre de la campaña", required: true },
    {
      name: "plantillaId",
      label: "Plantilla",
      optionsResource: "plantillas-email",
      optionsLabelKey: "nombre",
      colSpan: 1,
    },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      options: ESTADOS,
      colSpan: 1,
    },
  ],
  rowActions: [
    {
      label: "Enviar",
      onClick: async (row, reload) => {
        const r = row as Campana;
        if (r.estado === "Enviada") {
          toast("Ya fue enviada");
          return;
        }
        try {
          await crm.action(`campanas-email/${r.id}/enviar`);
          toast.success("Campaña enviada (simulado)");
          reload();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error");
        }
      },
    },
  ],
};

export default function EmailPage() {
  return <ResourcePage config={config} />;
}
