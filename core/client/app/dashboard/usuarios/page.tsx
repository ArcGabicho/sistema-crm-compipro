"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, date } from "@/app/components/dashboard/cells";

type Usuario = {
  id: number;
  email: string;
  name: string;
  role: string;
  activo: boolean;
  horaEntrada: string;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLES = ["admin", "user"].map((v) => ({ value: v, label: v }));

const config: ResourceConfig<Usuario> = {
  resource: "usuarios",
  title: "Usuarios",
  subtitle:
    "Cuentas del sistema, roles y estado. Eliminar = desactivar (baja lógica).",
  searchPlaceholder: "Buscar por email o nombre…",
  filters: [{ name: "role", label: "Rol", options: ROLES }],
  columns: [
    { key: "name", label: "Nombre", className: "font-medium text-gray-900" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Rol",
      render: (r) => badge(r.role, r.role === "admin" ? "purple" : "gray"),
    },
    {
      key: "activo",
      label: "Estado",
      render: (r) =>
        r.activo ? badge("Activo", "green") : badge("Inactivo", "red"),
    },
    {
      key: "horaEntrada",
      label: "Entrada",
      render: (r) => r.horaEntrada ?? "—",
    },
    {
      key: "lastLoginAt",
      label: "Último acceso",
      render: (r) => date(r.lastLoginAt),
    },
  ],
  fields: [
    { name: "name", label: "Nombre", required: true, colSpan: 1 },
    { name: "email", label: "Email", type: "email", required: true, colSpan: 1 },
    { name: "role", label: "Rol", type: "select", options: ROLES, colSpan: 1 },
    {
      name: "horaEntrada",
      label: "Hora de entrada",
      type: "time",
      colSpan: 1,
    },
    {
      name: "activo",
      label: "Activo",
      type: "checkbox",
      placeholder: "Cuenta activa",
      colSpan: 1,
    },
    {
      name: "password",
      label: "Contraseña (dejar vacío = no cambiar)",
      type: "text",
    },
  ],
};

export default function UsuariosPage() {
  return <ResourcePage config={config} />;
}
