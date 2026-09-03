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
  "rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-orange-500 focus:outline-none";

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
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500">
          Producción, fecha compromiso y cobranza (adelanto 50% / saldo contra
          entrega).
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o cliente…"
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Producción: todos</option>
          {PROD.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={atrasados}
            onChange={(e) => setAtrasados(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-orange-500"
          />
          Solo atrasados
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
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
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  Sin pedidos. Aprueba una cotización para generar uno.
                </td>
              </tr>
            )}
            {!loading &&
              data?.items.map((p) => (
                <tr key={p.id} className="hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                    {p.codigo}
                  </td>
                  <td className="px-4 py-3">{p.cliente?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.cotizacion?.codigo ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.atrasado ? (
                      <span className="font-medium text-red-600">
                        {date(p.fechaCompromiso)} ⚠
                      </span>
                    ) : (
                      <span className="text-gray-500">
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
                  <td className="px-4 py-3 text-gray-600">{money(p.pagado)}</td>
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
                      className="rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-gray-900">
          Pago · {pedido.codigo}
        </h2>
        <p className="text-xs text-gray-500">
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            Registrar
          </button>
        </div>
      </form>
    </div>
  );
}
