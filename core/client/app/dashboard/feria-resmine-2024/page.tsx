"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge } from "@/app/components/dashboard/cells";

type Participante = {
  id: number;
  nombre: string;
  rol: string | null;
  stand: string | null;
  asistio: boolean;
};

const ROLES = ["Cliente", "Proveedor", "Staff"].map((v) => ({
  value: v,
  label: v,
}));

const config: ResourceConfig<Participante> = {
  resource: "participantes",
  title: "Feria Resmine 2024",
  subtitle:
    "Participantes, asignación de stands y control de asistencia del evento.",
  searchPlaceholder: "Buscar participante…",
  filters: [{ name: "rol", label: "Rol", options: ROLES }],
  columns: [
    { key: "nombre", label: "Participante", className: "font-medium text-ink" },
    { key: "rol", label: "Rol", render: (r) => badge(r.rol, "blue") },
    { key: "stand", label: "Stand" },
    {
      key: "asistio",
      label: "Asistencia",
      render: (r) =>
        r.asistio ? badge("Asistió", "green") : badge("Pendiente", "gray"),
    },
  ],
  fields: [
    { name: "eventoId", label: "Evento", type: "number", placeholder: "1", colSpan: 1 },
    { name: "stand", label: "Stand", placeholder: "A3", colSpan: 1 },
    { name: "nombre", label: "Nombre", required: true },
    { name: "rol", label: "Rol", type: "select", options: ROLES, colSpan: 1 },
    {
      name: "asistio",
      label: "Asistencia",
      type: "checkbox",
      placeholder: "Asistió",
      colSpan: 1,
    },
  ],
};

export default function FeriaPage() {
  return <ResourcePage config={config} />;
}
