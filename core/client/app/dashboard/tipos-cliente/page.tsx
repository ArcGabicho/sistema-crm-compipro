"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";

type TipoCliente = {
  id: number;
  nombre: string;
  descripcion: string | null;
  descuentoPct: number;
  color: string;
};

const config: ResourceConfig<TipoCliente> = {
  resource: "tipos-cliente",
  title: "Tipos de Cliente",
  subtitle: "Categorías de clientes, descuentos y segmentación.",
  searchPlaceholder: "Buscar tipo…",
  columns: [
    {
      key: "color",
      label: "",
      render: (r) => (
        <span
          className="inline-block h-4 w-4 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: r.color }}
        />
      ),
      className: "w-10",
    },
    { key: "nombre", label: "Nombre", className: "font-medium text-ink" },
    { key: "descripcion", label: "Descripción" },
    {
      key: "descuentoPct",
      label: "Descuento",
      render: (r) => `${r.descuentoPct}%`,
    },
  ],
  fields: [
    { name: "nombre", label: "Nombre", required: true },
    { name: "descripcion", label: "Descripción", type: "textarea" },
    {
      name: "descuentoPct",
      label: "Descuento (%)",
      type: "number",
      step: "0.5",
      colSpan: 1,
    },
    { name: "color", label: "Color (hex)", placeholder: "#f59e0b", colSpan: 1 },
  ],
};

export default function TiposClientePage() {
  return <ResourcePage config={config} />;
}
