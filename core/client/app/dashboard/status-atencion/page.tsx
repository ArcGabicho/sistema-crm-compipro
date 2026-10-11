"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, estadoTone } from "@/app/components/dashboard/cells";

type Ticket = {
  id: number;
  asunto: string;
  estado: string;
  prioridad: string;
  cliente?: { nombre: string } | null;
  asignadoA?: { name: string } | null;
};

const ESTADOS = ["Abierto", "EnProceso", "Resuelto", "Cerrado"].map((v) => ({
  value: v,
  label: v,
}));
const PRIORIDADES = ["Baja", "Media", "Alta", "Urgente"].map((v) => ({
  value: v,
  label: v,
}));
const prioTone = (p: string) =>
  p === "Urgente" ? "red" : p === "Alta" ? "yellow" : "gray";

const config: ResourceConfig<Ticket> = {
  resource: "tickets",
  title: "Status de Atención",
  subtitle: "Tickets de soporte: seguimiento, estado y asignación.",
  searchPlaceholder: "Buscar por asunto…",
  filters: [
    { name: "estado", label: "Estado", options: ESTADOS },
    { name: "prioridad", label: "Prioridad", options: PRIORIDADES },
  ],
  columns: [
    { key: "asunto", label: "Asunto", className: "font-medium text-ink" },
    { key: "cliente", label: "Cliente", render: (r) => r.cliente?.nombre ?? "—" },
    {
      key: "prioridad",
      label: "Prioridad",
      render: (r) => badge(r.prioridad, prioTone(r.prioridad)),
    },
    {
      key: "estado",
      label: "Estado",
      render: (r) => badge(r.estado, estadoTone(r.estado)),
    },
    {
      key: "asignado",
      label: "Asignado a",
      render: (r) => r.asignadoA?.name ?? "Sin asignar",
    },
  ],
  fields: [
    { name: "asunto", label: "Asunto", required: true },
    { name: "descripcion", label: "Descripción", type: "textarea" },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      options: ESTADOS,
      colSpan: 1,
    },
    {
      name: "prioridad",
      label: "Prioridad",
      type: "select",
      options: PRIORIDADES,
      colSpan: 1,
    },
    {
      name: "clienteId",
      label: "Cliente",
      optionsResource: "clientes",
      optionsLabelKey: "nombre",
      colSpan: 1,
    },
    {
      name: "asignadoAId",
      label: "Asignar a",
      optionsResource: "usuarios",
      optionsLabelKey: "name",
      colSpan: 1,
    },
  ],
};

export default function StatusAtencionPage() {
  return <ResourcePage config={config} />;
}
