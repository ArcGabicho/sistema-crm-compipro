"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import { crm } from "@/app/lib/crm";
import { usePermiso } from "@/app/lib/permisos";

type PipelinePunto = { etapa: string; cantidad: number; orden: number };

type Cliente = {
  id: number;
  nombre: string;
  razonSocial?: string | null;
  rubro?: string | null;
  vendedor?: string | null;
  etapa?: string | null;
  [k: string]: unknown;
};

// Embudo comercial de la agencia (nomenclatura real de la cartera).
const ETAPAS_BASE = [
  "Contacto Inicial-1",
  "Retomar Contacto",
  "Pendientes por Cotizar",
  "Cotizado",
  "Venta Realizado",
  "Venta No Realizado",
  "Prod. Entregado",
];

export default function PipelinePage() {
  const permiso = usePermiso("clientes");
  const [columnas, setColumnas] = useState<PipelinePunto[]>([]);
  const [porEtapa, setPorEtapa] = useState<Record<string, Cliente[]>>({});
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      setLoading(true);
      try {
        const punts = await crm.stats<PipelinePunto[]>("pipeline");
        // Une las etapas con datos y las etapas base, respetando el orden.
        const nombres = Array.from(
          new Set([...ETAPAS_BASE, ...punts.map((p) => p.etapa)]),
        );
        const cols: PipelinePunto[] = nombres.map((etapa) => {
          const found = punts.find((p) => p.etapa === etapa);
          const baseIdx = ETAPAS_BASE.indexOf(etapa);
          return {
            etapa,
            cantidad: found?.cantidad ?? 0,
            orden: found?.orden ?? (baseIdx >= 0 ? baseIdx : 99),
          };
        });
        cols.sort((a, b) => a.orden - b.orden || a.etapa.localeCompare(b.etapa));

        const listas = await Promise.all(
          cols.map((c) =>
            crm.list<Cliente>("clientes", { etapa: c.etapa, pageSize: 100 }),
          ),
        );
        if (cancel) return;
        const mapa: Record<string, Cliente[]> = {};
        cols.forEach((c, i) => {
          mapa[c.etapa] = listas[i].items;
        });
        setColumnas(cols);
        setPorEtapa(mapa);
      } catch (e) {
        if (!cancel) toast.error(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [tick]);

  const mover = async (cliente: Cliente, etapa: string) => {
    if (etapa === (cliente.etapa ?? "")) return;
    setMoving(cliente.id);
    try {
      await crm.update("clientes", cliente.id, { ...cliente, etapa });
      toast.success(`${cliente.nombre} → ${etapa}`);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      setMoving(null);
    }
  };

  const opciones = columnas.map((c) => c.etapa);

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <header className="mb-5">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Pipeline comercial</h1>
        <p className="text-sm text-neutral-500">
          Arrastra el embudo moviendo cada cuenta de etapa. Total{" "}
          {columnas.reduce((a, c) => a + (porEtapa[c.etapa]?.length ?? 0), 0)}{" "}
          cuentas.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20 text-neutral-400">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 lg:min-h-0 lg:flex-1">
          {columnas.map((col) => {
            const items = porEtapa[col.etapa] ?? [];
            return (
              <div
                key={col.etapa}
                className="flex min-h-0 w-72 shrink-0 flex-col rounded-[1.75rem] bg-panel p-3 shadow-sm ring-1 ring-white"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-neutral-700">
                    {col.etapa}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-500">
                    {items.length}
                  </span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                  {items.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-neutral-400">
                      Sin cuentas
                    </p>
                  )}
                  {items.map((cli) => (
                    <div
                      key={cli.id}
                      className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-white"
                    >
                      <p className="truncate text-sm font-medium text-ink">
                        {cli.razonSocial || cli.nombre}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {[cli.rubro, cli.vendedor].filter(Boolean).join(" · ") ||
                          "—"}
                      </p>
                      <select
                        value={cli.etapa ?? ""}
                        disabled={moving === cli.id || !permiso.escribir}
                        onChange={(e) => mover(cli, e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-neutral-200/70 bg-frame px-2 py-1 text-xs focus:border-accent focus:outline-none disabled:opacity-50"
                      >
                        {!opciones.includes(cli.etapa ?? "") && (
                          <option value={cli.etapa ?? ""}>
                            {cli.etapa || "(sin etapa)"}
                          </option>
                        )}
                        {opciones.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
