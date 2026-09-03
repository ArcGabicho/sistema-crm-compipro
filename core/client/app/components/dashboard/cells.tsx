import type { ReactNode } from "react";

const nf = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 2,
});

export function money(value: unknown): string {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? nf.format(n) : "—";
}

export function date(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString("es-PE");
}

const TONES: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-600",
  purple: "bg-violet-100 text-violet-700",
};

export function badge(label: unknown, tone: keyof typeof TONES = "gray"): ReactNode {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {String(label ?? "—")}
    </span>
  );
}

export function estadoTone(estado: string): keyof typeof TONES {
  switch (estado) {
    case "Activo":
    case "Resuelto":
    case "Entregado":
    case "Enviada":
    case "Aprobada":
    case "Pagado":
    case "Listo":
    case "Convertida":
    case "ATiempo":
      return "green";
    case "Prospecto":
    case "EnProceso":
    case "Preparando":
    case "Programada":
    case "EnProduccion":
    case "ControlCalidad":
    case "Parcial":
    case "Atendida":
    case "Justificada":
      return "yellow";
    case "Inactivo":
    case "Cerrado":
    case "Borrador":
    case "Pendiente":
    case "Descartada":
      return "gray";
    case "Moroso":
    case "Devuelto":
    case "Abierto":
    case "Rechazada":
    case "Vencida":
    case "Tarde":
      return "red";
    case "EnRuta":
    case "Nueva":
    case "Temprano":
      return "blue";
    default:
      return "gray";
  }
}
