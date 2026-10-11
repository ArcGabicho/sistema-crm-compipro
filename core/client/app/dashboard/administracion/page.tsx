"use client";

import { useEffect, useState } from "react";
import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { date } from "@/app/components/dashboard/cells";
import { crm, type Paged } from "@/app/lib/crm";

type Config = {
  id: number;
  clave: string;
  valor: string | null;
  descripcion: string | null;
};

type Audit = {
  id: number;
  userEmail: string | null;
  accion: string;
  entidad: string;
  entidadId: number | null;
  createdAt: string;
};

const config: ResourceConfig<Config> = {
  resource: "configuracion",
  title: "Administración",
  subtitle: "Parámetros del sistema y registro de auditoría.",
  searchPlaceholder: "Buscar parámetro…",
  columns: [
    { key: "clave", label: "Clave", className: "font-mono text-xs" },
    { key: "valor", label: "Valor", className: "font-medium text-ink" },
    { key: "descripcion", label: "Descripción" },
  ],
  fields: [
    { name: "clave", label: "Clave", required: true, colSpan: 1 },
    { name: "valor", label: "Valor", colSpan: 1 },
    { name: "descripcion", label: "Descripción" },
  ],
};

export default function AdministracionPage() {
  return (
    <div className="space-y-10">
      <ResourcePage config={config} />
      <AuditPanel />
    </div>
  );
}

function AuditPanel() {
  const [rows, setRows] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crm
      .list<Audit>("audit", { pageSize: 30 })
      .then((p: Paged<Audit>) => setRows(p.items))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-ink">Auditoría del sistema</h2>
      <div className="overflow-x-auto rounded-[1.75rem] bg-panel shadow-sm ring-1 ring-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-neutral-200/70 bg-frame/70 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Acción</th>
              <th className="px-4 py-3 font-semibold">Entidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/60">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  Sin registros.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 text-neutral-500">
                    {date(r.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700">
                    {r.userEmail ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700">{r.accion}</td>
                  <td className="px-4 py-2.5 text-neutral-700">
                    {r.entidad}
                    {r.entidadId ? ` #${r.entidadId}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
