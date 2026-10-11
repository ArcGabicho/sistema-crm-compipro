"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";

type Proveedor = {
  id: number;
  nombre: string;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  ciudad: string | null;
  rating: number;
  terminosPago: string | null;
};

const config: ResourceConfig<Proveedor> = {
  resource: "proveedores",
  title: "Proveedores",
  subtitle: "Directorio, evaluación (rating) y términos de pago.",
  searchPlaceholder: "Buscar proveedor o contacto…",
  filters: [
    {
      name: "rating",
      label: "Rating",
      options: [1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} ★` })),
    },
  ],
  columns: [
    { key: "nombre", label: "Nombre", className: "font-medium text-ink" },
    { key: "contacto", label: "Contacto" },
    { key: "email", label: "Email" },
    { key: "ciudad", label: "Ciudad" },
    {
      key: "rating",
      label: "Rating",
      render: (r) => "★".repeat(r.rating) + "☆".repeat(5 - r.rating),
    },
    { key: "terminosPago", label: "Pago" },
  ],
  fields: [
    { name: "nombre", label: "Nombre", required: true },
    { name: "contacto", label: "Contacto", colSpan: 1 },
    { name: "email", label: "Email", type: "email", colSpan: 1 },
    { name: "telefono", label: "Teléfono", colSpan: 1 },
    { name: "ciudad", label: "Ciudad", colSpan: 1 },
    { name: "direccion", label: "Dirección" },
    {
      name: "rating",
      label: "Rating (1-5)",
      type: "number",
      step: "1",
      colSpan: 1,
    },
    {
      name: "terminosPago",
      label: "Términos de pago",
      type: "select",
      options: ["Contado", "15 días", "30 días", "45 días", "60 días"].map(
        (v) => ({ value: v, label: v }),
      ),
      colSpan: 1,
    },
  ],
};

export default function ProveedoresPage() {
  return <ResourcePage config={config} />;
}
