"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, date, estadoTone } from "@/app/components/dashboard/cells";

type Envio = {
  id: number;
  direccion: string;
  estado: string;
  transportista: string | null;
  tracking: string | null;
  ruta: string | null;
  fechaEstimada: string | null;
  cliente?: { nombre: string } | null;
};

const ESTADOS = ["Preparando", "EnRuta", "Entregado", "Devuelto"].map((v) => ({
  value: v,
  label: v,
}));

const config: ResourceConfig<Envio> = {
  resource: "envios",
  title: "Logística",
  subtitle: "Envíos, tracking, rutas y estado de entrega.",
  searchPlaceholder: "Buscar por tracking o dirección…",
  filters: [{ name: "estado", label: "Estado", options: ESTADOS }],
  columns: [
    { key: "tracking", label: "Tracking", className: "font-mono text-xs" },
    { key: "cliente", label: "Cliente", render: (r) => r.cliente?.nombre ?? "—" },
    { key: "ruta", label: "Ruta" },
    { key: "transportista", label: "Transportista" },
    {
      key: "estado",
      label: "Estado",
      render: (r) => badge(r.estado, estadoTone(r.estado)),
    },
    { key: "fechaEstimada", label: "Fecha est.", render: (r) => date(r.fechaEstimada) },
  ],
  fields: [
    {
      name: "clienteId",
      label: "Cliente",
      optionsResource: "clientes",
      optionsLabelKey: "nombre",
    },
    { name: "direccion", label: "Dirección", required: true },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      options: ESTADOS,
      colSpan: 1,
    },
    {
      name: "transportista",
      label: "Transportista",
      type: "select",
      options: ["Olva Courier", "Shalom", "Marvisur", "Interno"].map((v) => ({
        value: v,
        label: v,
      })),
      colSpan: 1,
    },
    { name: "tracking", label: "Tracking", colSpan: 1 },
    { name: "ruta", label: "Ruta", colSpan: 1 },
    {
      name: "fechaEstimada",
      label: "Fecha estimada",
      type: "date",
      colSpan: 1,
    },
  ],
};

export default function LogisticaPage() {
  return <ResourcePage config={config} />;
}
