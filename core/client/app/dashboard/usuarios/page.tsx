"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, date } from "@/app/components/dashboard/cells";
import { ROLES as ROLES_SISTEMA } from "@/app/lib/permisos";

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

const ROLES = ROLES_SISTEMA.map((r) => ({ value: r.value, label: r.label }));

const rolBadge = (role: string) => {
  const rol = ROLES_SISTEMA.find((r) => r.value === role);
  if (!rol) return badge("Sin rol asignado", "red");
  return badge(rol.label, role === "admin" ? "yellow" : role === "gerencia" ? "blue" : "gray");
};

const config: ResourceConfig<Usuario> = {
  resource: "usuarios",
  exportable: false,
  title: "Usuarios",
  subtitle:
    "Cuentas del sistema, roles y estado. Eliminar = desactivar (baja lógica).",
  searchPlaceholder: "Buscar por email o nombre…",
  filters: [{ name: "role", label: "Rol", options: ROLES }],
  columns: [
    { key: "name", label: "Nombre", className: "font-medium text-ink" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Rol",
      render: (r) => rolBadge(r.role),
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
    { name: "role", label: "Rol", type: "select", options: ROLES, required: true, colSpan: 1 },
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
