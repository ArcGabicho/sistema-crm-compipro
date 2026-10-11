"use client";

import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { date } from "@/app/components/dashboard/cells";

type Documento = {
  id: number;
  nombre: string;
  carpeta: string;
  tipo: string | null;
  tamanoBytes: number;
  version: number;
  url: string | null;
  createdAt: string;
};

const kb = (b: number) =>
  b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`;

const config: ResourceConfig<Documento> = {
  resource: "documentos",
  title: "Documentos",
  subtitle:
    "Repositorio: carpetas, versiones y metadatos. (La subida de archivos se integra aparte.)",
  searchPlaceholder: "Buscar documento…",
  filters: [
    {
      name: "carpeta",
      label: "Carpeta",
      options: [
        "Comercial",
        "Legal",
        "Calidad",
        "Marketing",
        "Eventos",
        "Reportes",
        "General",
      ].map((v) => ({ value: v, label: v })),
    },
  ],
  columns: [
    { key: "nombre", label: "Nombre", className: "font-medium text-ink" },
    { key: "carpeta", label: "Carpeta" },
    { key: "tipo", label: "Tipo" },
    { key: "version", label: "Versión", render: (r) => `v${r.version}` },
    { key: "tamanoBytes", label: "Tamaño", render: (r) => kb(r.tamanoBytes) },
    { key: "createdAt", label: "Creado", render: (r) => date(r.createdAt) },
  ],
  fields: [
    { name: "nombre", label: "Nombre del archivo", required: true },
    {
      name: "carpeta",
      label: "Carpeta",
      type: "select",
      options: [
        "Comercial",
        "Legal",
        "Calidad",
        "Marketing",
        "Eventos",
        "Reportes",
        "General",
      ].map((v) => ({ value: v, label: v })),
      colSpan: 1,
    },
    { name: "tipo", label: "Tipo (pdf, docx…)", colSpan: 1 },
    { name: "version", label: "Versión", type: "number", colSpan: 1 },
    {
      name: "tamanoBytes",
      label: "Tamaño (bytes)",
      type: "number",
      colSpan: 1,
    },
    { name: "url", label: "URL / enlace" },
  ],
};

export default function DocumentosPage() {
  return <ResourcePage config={config} />;
}
