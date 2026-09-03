"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { crm, type Paged } from "@/app/lib/crm";
import { badge, date, estadoTone, money } from "@/app/components/dashboard/cells";

type Ref = { id: number; nombre?: string; name?: string } | null;
type Item = {
  id?: number;
  productoId: number | null;
  descripcion: string;
  tecnica: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
};
type Cotizacion = {
  id: number;
  codigo: string;
  clienteId: number;
  cliente?: Ref;
  vendedorId: number | null;
  vendedor?: Ref;
  estado: string;
  fecha: string;
  validaHasta: string | null;
  notas: string | null;
  subtotal: number;
  igv: number;
  total: number;
  items: Item[];
};
type Producto = {
  id: number;
  nombre: string;
  precio: number;
  tecnicasDisponibles: string | null;
  minimoPedido: number;
};

const ESTADOS = ["Borrador", "Enviada", "Aprobada", "Rechazada", "Vencida"];
const IGV = 0.18;
const inp =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

export default function CotizacionesPage() {
  const [data, setData] = useState<Paged<Cotizacion> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState<Cotizacion | "new" | null>(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const pageSize = 15;

  useEffect(() => {
    let cancel = false;
    void (async () => {
      setLoading(true);
      try {
        const d = await crm.list<Cotizacion>("cotizaciones", {
          page,
          pageSize,
          search: search || undefined,
          estado: estado || undefined,
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
  }, [page, search, estado, tick]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-sm text-gray-500">
            Producto + técnica de personalización + cantidad. Al aprobar se genera
            el pedido.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> Nueva cotización
        </button>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por código o cliente…"
          className={`${inp} w-full max-w-xs`}
        />
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPage(1);
          }}
          className={`${inp} w-auto`}
        >
          <option value="">Estado: todos</option>
          {ESTADOS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {["Código", "Cliente", "Fecha", "Líneas", "Total", "Estado", ""].map(
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
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  Sin cotizaciones.
                </td>
              </tr>
            )}
            {!loading &&
              data?.items.map((c) => (
                <tr key={c.id} className="hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                    {c.codigo}
                  </td>
                  <td className="px-4 py-3">{c.cliente?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{date(c.fecha)}</td>
                  <td className="px-4 py-3">{c.items?.length ?? 0}</td>
                  <td className="px-4 py-3 font-medium">{money(c.total)}</td>
                  <td className="px-4 py-3">
                    {badge(c.estado, estadoTone(c.estado))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 text-xs font-medium">
                      {c.estado === "Borrador" && (
                        <button
                          type="button"
                          onClick={() =>
                            act(
                              () =>
                                crm.action(`cotizaciones/${c.id}/estado`, {
                                  estado: "Enviada",
                                }),
                              "Enviada al cliente",
                            )
                          }
                          className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
                        >
                          Enviar
                        </button>
                      )}
                      {c.estado !== "Aprobada" && (
                        <button
                          type="button"
                          onClick={() =>
                            act(
                              () => crm.action(`cotizaciones/${c.id}/aprobar`),
                              "Aprobada · pedido generado",
                            )
                          }
                          className="rounded px-2 py-1 text-emerald-600 hover:bg-emerald-50"
                        >
                          Aprobar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          act(
                            () => crm.action(`cotizaciones/${c.id}/duplicar`),
                            "Cotización duplicada",
                          )
                        }
                        className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                      >
                        Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="rounded px-2 py-1 text-orange-600 hover:bg-orange-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window.confirm(`¿Eliminar ${c.codigo}?`) &&
                          act(
                            () => crm.remove("cotizaciones", c.id),
                            "Eliminada",
                          )
                        }
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
        <span>{total} cotizaciones</span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      {editing !== null && (
        <CotizacionForm
          record={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function CotizacionForm({
  record,
  onClose,
  onSaved,
}: {
  record: Cotizacion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: number; name: string }[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clienteId, setClienteId] = useState(String(record?.clienteId ?? ""));
  const [vendedorId, setVendedorId] = useState(
    String(record?.vendedorId ?? ""),
  );
  const [validaHasta, setValidaHasta] = useState(
    (record?.validaHasta ?? "").slice(0, 10),
  );
  const [notas, setNotas] = useState(record?.notas ?? "");
  const [items, setItems] = useState<Item[]>(
    record?.items?.map((i) => ({ ...i })) ?? [
      {
        productoId: null,
        descripcion: "",
        tecnica: null,
        cantidad: 100,
        precioUnitario: 0,
      },
    ],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    crm
      .list<{ id: number; nombre: string }>("clientes", { pageSize: 300 })
      .then((d) => setClientes(d.items));
    crm
      .list<{ id: number; name: string }>("usuarios", { pageSize: 100 })
      .then((d) => setUsuarios(d.items));
    crm
      .list<Producto>("productos", { pageSize: 300 })
      .then((d) => setProductos(d.items));
  }, []);

  const setItem = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const onPickProducto = (idx: number, pid: string) => {
    const p = productos.find((x) => x.id === Number(pid));
    setItem(idx, {
      productoId: pid ? Number(pid) : null,
      descripcion: p ? `${p.nombre} — personalización con logo` : items[idx].descripcion,
      precioUnitario: p ? p.precio : items[idx].precioUnitario,
      tecnica:
        p?.tecnicasDisponibles?.split(",")[0]?.trim() ?? items[idx].tecnica,
    });
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precioUnitario) || 0),
      0,
    );
    const igv = subtotal * IGV;
    return { subtotal, igv, total: subtotal + igv };
  }, [items]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return toast.error("Selecciona un cliente");
    const clean = items.filter((i) => i.descripcion.trim() && Number(i.cantidad) > 0);
    if (clean.length === 0) return toast.error("Agrega al menos una línea");
    setSaving(true);
    const payload = {
      clienteId: Number(clienteId),
      vendedorId: vendedorId ? Number(vendedorId) : null,
      validaHasta: validaHasta || null,
      notas: notas || null,
      items: clean.map((i) => ({
        productoId: i.productoId,
        descripcion: i.descripcion,
        tecnica: i.tecnica,
        cantidad: Number(i.cantidad),
        precioUnitario: Number(i.precioUnitario),
      })),
    };
    try {
      if (record) await crm.update("cotizaciones", record.id, payload);
      else await crm.create("cotizaciones", payload);
      toast.success(record ? "Cotización actualizada" : "Cotización creada");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {record ? `Editar ${record.codigo}` : "Nueva cotización"}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Cliente *
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                className={inp}
              >
                <option value="">—</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Vendedor
              </label>
              <select
                value={vendedorId}
                onChange={(e) => setVendedorId(e.target.value)}
                className={inp}
              >
                <option value="">—</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Válida hasta
              </label>
              <input
                type="date"
                value={validaHasta}
                onChange={(e) => setValidaHasta(e.target.value)}
                className={inp}
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Líneas</h3>
              <button
                type="button"
                onClick={() =>
                  setItems((p) => [
                    ...p,
                    {
                      productoId: null,
                      descripcion: "",
                      tecnica: null,
                      cantidad: 100,
                      precioUnitario: 0,
                    },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" /> Línea
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => {
                const p = productos.find((x) => x.id === it.productoId);
                const tecOpts = (p?.tecnicasDisponibles ?? "Serigrafía,Bordado,Tampografía,DTF,Full color")
                  .split(",")
                  .map((s) => s.trim());
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200 p-3"
                  >
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                      <select
                        value={it.productoId ?? ""}
                        onChange={(e) => onPickProducto(idx, e.target.value)}
                        className={`${inp} col-span-2 sm:col-span-4`}
                      >
                        <option value="">Producto…</option>
                        {productos.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.nombre}
                          </option>
                        ))}
                      </select>
                      <select
                        value={it.tecnica ?? ""}
                        onChange={(e) =>
                          setItem(idx, { tecnica: e.target.value || null })
                        }
                        className={`${inp} col-span-2 sm:col-span-3`}
                      >
                        <option value="">Técnica…</option>
                        {tecOpts.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={it.cantidad}
                        onChange={(e) =>
                          setItem(idx, { cantidad: Number(e.target.value) })
                        }
                        placeholder="Cant."
                        className={`${inp} col-span-1 sm:col-span-2`}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={it.precioUnitario}
                        onChange={(e) =>
                          setItem(idx, {
                            precioUnitario: Number(e.target.value),
                          })
                        }
                        placeholder="P. unit"
                        className={`${inp} col-span-1 sm:col-span-2`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="col-span-2 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 sm:col-span-1 sm:py-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sm:hidden">Quitar línea</span>
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={it.descripcion}
                        onChange={(e) =>
                          setItem(idx, { descripcion: e.target.value })
                        }
                        placeholder="Descripción de la línea"
                        className={`${inp} flex-1`}
                      />
                      <span className="whitespace-nowrap text-sm font-medium text-gray-700">
                        {money(
                          (Number(it.cantidad) || 0) *
                            (Number(it.precioUnitario) || 0),
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Notas (condiciones, muestra, adelanto…)"
            className={`${inp} mt-4 resize-y`}
          />

          <div className="mt-4 flex flex-col items-end gap-0.5 text-sm">
            <span className="text-gray-500">
              Subtotal: <b className="text-gray-800">{money(totals.subtotal)}</b>
            </span>
            <span className="text-gray-500">
              IGV (18%): <b className="text-gray-800">{money(totals.igv)}</b>
            </span>
            <span className="text-base">
              Total: <b className="text-orange-600">{money(totals.total)}</b>
            </span>
          </div>

          <div className="mt-5 flex justify-end gap-2">
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
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
