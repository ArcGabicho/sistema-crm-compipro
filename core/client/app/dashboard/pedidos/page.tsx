"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import { crm, type Paged } from "@/app/lib/crm";
import { badge, date, estadoTone, money } from "@/app/components/dashboard/cells";

type Pedido = {
  id: number;
  codigo: string;
  cliente?: { nombre: string } | null;
  cotizacion?: { codigo: string } | null;
  estadoProduccion: string;
  fecha: string;
  fechaCompromiso: string | null;
  total: number;
  pagado: number;
  saldo: number;
  estadoPago: string;
  atrasado: boolean;
};

const PROD = ["Pendiente", "EnProduccion", "ControlCalidad", "Listo", "Entregado"];
const inp =
  "rounded-2xl border border-neutral-200 bg-white px-2 py-1 text-xs focus:border-accent focus:outline-none";

export default function PedidosPage() {
  const [data, setData] = useState<Paged<Pedido> | null>(null);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState("");
  const [atrasados, setAtrasados] = useState(false);
  const [search, setSearch] = useState("");
  const [tick, setTick] = useState(0);
  const [pago, setPago] = useState<Pedido | null>(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      setLoading(true);
      try {
        const d = await crm.list<Pedido>("pedidos", {
          pageSize: 100,
          search: search || undefined,
          estado: estado || undefined,
          atrasados: atrasados || undefined,
        });
        if (!cancel) setData(d);
      } catch (e) {
        if (!cancel) toast.error(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [estado, atrasados, search, tick]);

  const changeEstado = async (p: Pedido, next: string) => {
    try {
      await crm.action(`pedidos/${p.id}/estado`, { estadoProduccion: next });
      toast.success(`${p.codigo} → ${next}`);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <header className="mb-5">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Pedidos</h1>
        <p className="text-sm text-neutral-500">
          Producción, fecha compromiso y cobranza (adelanto 50% / saldo contra
          entrega).
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o cliente…"
          className="w-full max-w-xs rounded-full bg-panel px-4 py-2.5 text-sm text-ink shadow-sm ring-1 ring-white focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-full bg-panel px-4 py-2.5 text-sm text-ink shadow-sm ring-1 ring-white focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="">Producción: todos</option>
          {PROD.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={atrasados}
            onChange={(e) => setAtrasados(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-200 text-accent"
          />
          Solo atrasados
        </label>
      </div>

      <div className="overflow-x-auto rounded-[1.75rem] bg-panel shadow-sm ring-1 ring-white lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-neutral-200/70 bg-frame text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              {["Código", "Cliente", "Cotización", "Compromiso", "Producción", "Total", "Pagado", "Saldo", ""].map(
                (h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/60">
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-neutral-400">
                  <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-neutral-400">
                  Sin pedidos. Aprueba una cotización para generar uno.
                </td>
              </tr>
            )}
            {!loading &&
              data?.items.map((p) => (
                <tr key={p.id} className="hover:bg-white/60">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-ink">
                    {p.codigo}
                  </td>
                  <td className="px-4 py-3">{p.cliente?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                    {p.cotizacion?.codigo ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.atrasado ? (
                      <span className="font-medium text-red-600">
                        {date(p.fechaCompromiso)} ⚠
                      </span>
                    ) : (
                      <span className="text-neutral-500">
                        {date(p.fechaCompromiso)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.estadoProduccion}
                      onChange={(e) => changeEstado(p, e.target.value)}
                      className={inp}
                    >
                      {PROD.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-medium">{money(p.total)}</td>
                  <td className="px-4 py-3 text-neutral-600">{money(p.pagado)}</td>
                  <td className="px-4 py-3">
                    {badge(
                      p.saldo > 0 ? money(p.saldo) : p.estadoPago,
                      estadoTone(p.estadoPago),
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setPago(p)}
                      disabled={p.saldo <= 0}
                      className="rounded-full px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                    >
                      Registrar pago
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pago && (
        <PagoModal
          pedido={pago}
          onClose={() => setPago(null)}
          onDone={() => {
            setPago(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function PagoModal({
  pedido,
  onClose,
  onDone,
}: {
  pedido: Pedido;
  onClose: () => void;
  onDone: () => void;
}) {
  const [monto, setMonto] = useState(String(Math.round(pedido.saldo * 100) / 100));
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await crm.action(`pedidos/${pedido.id}/pago`, { monto: Number(monto) });
      toast.success("Pago registrado");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-[1.75rem] bg-panel p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-ink">
          Pago · {pedido.codigo}
        </h2>
        <p className="text-xs text-neutral-500">
          Total {money(pedido.total)} · Pagado {money(pedido.pagado)} · Saldo{" "}
          {money(pedido.saldo)}
        </p>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
          className="w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-neutral-600 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
          >
            Registrar
          </button>
        </div>
      </form>
    </div>
  );
}
