"use client";

import { useAuth } from "@/app/hooks/useAuth";

// Espejo de core/server/Config/Permisos.cs. El backend es quien aplica la
// seguridad; aquí solo se usa para no mostrar opciones que darían 403.

export type Acceso = "leer" | "escribir" | "eliminar";

export const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "ventas", label: "Ventas" },
  { value: "operaciones", label: "Operaciones" },
  { value: "gerencia", label: "Gerencia" },
] as const;

export type Modulo =
  | "estadisticas"
  | "solicitudes"
  | "clientes"
  | "tipos-cliente"
  | "cotizaciones"
  | "pedidos"
  | "tickets"
  | "inventario"
  | "logistica"
  | "proveedores"
  | "documentos"
  | "email"
  | "eventos"
  | "ventas"
  | "usuarios"
  | "configuracion"
  | "auditoria"
  | "asistencia"
  | "cuenta";

const TODOS: Modulo[] = [
  "estadisticas", "solicitudes", "clientes", "tipos-cliente", "cotizaciones", "pedidos",
  "tickets", "inventario", "logistica", "proveedores", "documentos", "email", "eventos",
  "ventas", "usuarios", "configuracion", "auditoria", "asistencia", "cuenta",
];

type Nivel = 0 | 1 | 2; // ninguno | leer | escribir
const L = 1;
const E = 2;

const MATRIZ: Record<string, Partial<Record<Modulo, Nivel>>> = {
  ventas: {
    estadisticas: L, solicitudes: E, clientes: E, "tipos-cliente": L, cotizaciones: E,
    pedidos: L, tickets: E, inventario: L, documentos: E, email: E, eventos: E,
    ventas: E, asistencia: E, cuenta: E,
  },
  operaciones: {
    estadisticas: L, clientes: L, "tipos-cliente": L, cotizaciones: L, pedidos: E,
    tickets: E, inventario: E, logistica: E, proveedores: E, documentos: E, ventas: L,
    asistencia: E, cuenta: E,
  },
  gerencia: Object.fromEntries(
    TODOS.map((m) => [m, m === "asistencia" || m === "cuenta" ? E : L]),
  ),
};

const SIN_ROL: Partial<Record<Modulo, Nivel>> = { estadisticas: L, asistencia: E, cuenta: E };

const NIVEL: Record<Acceso, number> = { leer: 1, escribir: 2, eliminar: 3 };

export function puede(role: string | undefined, modulo: Modulo, acceso: Acceso): boolean {
  if (role === "admin") return true;
  if (acceso === "eliminar") return false;
  const permisos = (role && MATRIZ[role]) || SIN_ROL;
  return (permisos[modulo] ?? 0) >= NIVEL[acceso];
}

export function usePermiso(modulo: Modulo) {
  const { user } = useAuth();
  const role = user?.role;
  return {
    leer: puede(role, modulo, "leer"),
    escribir: puede(role, modulo, "escribir"),
    eliminar: puede(role, modulo, "eliminar"),
  };
}

/** Módulo de cada recurso de la API (/api/crm/<recurso>). */
export const MODULO_POR_RECURSO: Record<string, Modulo> = {
  clientes: "clientes",
  "tipos-cliente": "tipos-cliente",
  cotizaciones: "cotizaciones",
  pedidos: "pedidos",
  tickets: "tickets",
  productos: "inventario",
  "movimientos-inventario": "inventario",
  envios: "logistica",
  proveedores: "proveedores",
  documentos: "documentos",
  "campanas-email": "email",
  "plantillas-email": "email",
  eventos: "eventos",
  participantes: "eventos",
  ventas: "ventas",
  usuarios: "usuarios",
  configuracion: "configuracion",
  audit: "auditoria",
  asistencia: "asistencia",
  solicitudes: "solicitudes",
};

/** Módulo de cada página del panel. */
export const MODULO_POR_RUTA: Record<string, Modulo> = {
  "/dashboard": "estadisticas",
  "/dashboard/solicitudes": "solicitudes",
  "/dashboard/pipeline": "clientes",
  "/dashboard/clientes": "clientes",
  "/dashboard/cotizaciones": "cotizaciones",
  "/dashboard/pedidos": "pedidos",
  "/dashboard/status-atencion": "tickets",
  "/dashboard/tipos-cliente": "tipos-cliente",
  "/dashboard/proveedores": "proveedores",
  "/dashboard/logistica": "logistica",
  "/dashboard/administracion": "configuracion",
  "/dashboard/usuarios": "usuarios",
  "/dashboard/asistencia": "asistencia",
  "/dashboard/documentos": "documentos",
  "/dashboard/email": "email",
  "/dashboard/eventos": "eventos",
  "/dashboard/inventario": "inventario",
};
