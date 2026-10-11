"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, estadoTone, money } from "@/app/components/dashboard/cells";

type Cliente = {
  id: number;
  nombre: string;
  razonSocial: string | null;
  ruc: string | null;
  rubro: string | null;
  contacto: string | null;
  cargo: string | null;
  email: string | null;
  telefono: string | null;
  paginaWeb: string | null;
  ciudad: string | null;
  region: string | null;
  etapa: string | null;
  medioContacto: string | null;
  vendedor: string | null;
  estado: string;
  totalCompras: number;
  tipoCliente?: { nombre: string } | null;
};

const ESTADOS = ["Activo", "Prospecto", "Inactivo", "Moroso"].map((v) => ({
  value: v,
  label: v,
}));

const config: ResourceConfig<Cliente> = {
  resource: "clientes",
  title: "Clientes",
  subtitle:
    "Cartera importada + altas manuales. Búsqueda, filtros y clasificación.",
  searchPlaceholder: "Buscar por nombre o email…",
  filters: [{ name: "estado", label: "Estado", options: ESTADOS }],
  columns: [
    { key: "nombre", label: "Empresa", className: "font-medium text-ink" },
    { key: "ruc", label: "RUC", className: "font-mono text-xs" },
    { key: "contacto", label: "Contacto" },
    { key: "rubro", label: "Rubro" },
    { key: "ciudad", label: "Distrito" },
    {
      key: "estado",
      label: "Estado",
      render: (r) => badge(r.estado, estadoTone(r.estado)),
    },
    {
      key: "totalCompras",
      label: "Total compras",
      render: (r) => money(r.totalCompras),
    },
  ],
  fields: [
    { name: "nombre", label: "Empresa", required: true, colSpan: 1 },
    { name: "razonSocial", label: "Razón social", colSpan: 1 },
    { name: "ruc", label: "RUC", colSpan: 1 },
    { name: "rubro", label: "Rubro", colSpan: 1 },
    { name: "contacto", label: "Contacto", colSpan: 1 },
    { name: "cargo", label: "Cargo", colSpan: 1 },
    { name: "email", label: "Email", type: "email", colSpan: 1 },
    { name: "telefono", label: "Teléfono", colSpan: 1 },
    { name: "paginaWeb", label: "Página web", colSpan: 1 },
    { name: "direccion", label: "Dirección" },
    { name: "ciudad", label: "Distrito", colSpan: 1 },
    { name: "region", label: "Provincia", colSpan: 1 },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      options: ESTADOS,
      colSpan: 1,
    },
    {
      name: "tipoClienteId",
      label: "Tipo de cliente",
      optionsResource: "tipos-cliente",
      optionsLabelKey: "nombre",
      colSpan: 1,
    },
    { name: "etapa", label: "Etapa (pipeline)", colSpan: 1 },
    { name: "medioContacto", label: "Medio de contacto", colSpan: 1 },
    { name: "vendedor", label: "Vendedor asignado", colSpan: 1 },
    { name: "notas", label: "Notas", type: "textarea" },
  ],
};

export default function ClientesPage() {
  return <ResourcePage config={config} />;
}
