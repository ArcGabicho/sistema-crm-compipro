"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ChevronDown, LoaderCircle, Mail, Phone, UserPlus } from "lucide-react";
import { crm, type Paged } from "@/app/lib/crm";
import { badge, date } from "@/app/components/dashboard/cells";

type Solicitud = {
  id: number;
  tipo: string;
  nombre: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  mensaje: string | null;
  productoNombre: string | null;
  categoria: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigoPostal: string | null;
  estado: string;
  clienteId: number | null;
  cliente?: { id: number; nombre: string } | null;
  notas: string | null;
  createdAt: string;
  atendidaAt: string | null;
};

const ESTADOS = ["Nueva", "Atendida", "Convertida", "Descartada"];
const TIPOS = ["Cotizacion", "Contacto"];
const selCls =
  "rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-orange-500 focus:outline-none";

export default function SolicitudesPage() {
  const [data, setData] = useState<Paged<Solicitud> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      setLoading(true);
      try {
        const d = await crm.list<Solicitud>("solicitudes", {
          pageSize: 100,
          tipo: tipo || undefined,
          estado: estado || undefined,
          search: search || undefined,
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
  }, [tipo, estado, search, tick]);

  const cambiarEstado = async (s: Solicitud, next: string) => {
    setBusy(s.id);
    try {
      await crm.action(`solicitudes/${s.id}/estado`, { estado: next });
      toast.success(`${s.nombre} → ${next}`);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const convertir = async (s: Solicitud) => {
    if (
      !window.confirm(
        `¿Crear un cliente a partir de la solicitud de ${s.empresa || s.nombre}?`,
      )
    )
      return;
    setBusy(s.id);
    try {
      const cliente = await crm.action<{ id: number; nombre: string }>(
        `solicitudes/${s.id}/convertir`,
      );
      toast.success(`Cliente creado: ${cliente.nombre}`);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const eliminar = async (s: Solicitud) => {
    if (!window.confirm("¿Eliminar esta solicitud?")) return;
    setBusy(s.id);
    try {
      await crm.remove("solicitudes", s.id);
      toast.success("Solicitud eliminada");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const nuevas = data?.items.filter((s) => s.estado === "Nueva").length ?? 0;

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes web</h1>
        <p className="text-sm text-gray-500">
          Formularios de cotización y contacto del sitio público.{" "}
          {nuevas > 0 && (
            <span className="font-medium text-amber-600">
              {nuevas} sin revisar.
            </span>
          )}
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa o correo…"
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Tipo: todos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t === "Cotizacion" ? "Cotización" : "Contacto"}
            </option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Estado: todos</option>
          {ESTADOS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {["Fecha", "Tipo", "Solicitante", "Contacto", "Interés", "Estado", ""].map(
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
                  No hay solicitudes con esos filtros.
                </td>
              </tr>
            )}
            {!loading &&
              data?.items.map((s) => (
                <FragmentRow
                  key={s.id}
                  s={s}
                  open={expanded === s.id}
                  busy={busy === s.id}
                  onToggle={() =>
                    setExpanded((cur) => (cur === s.id ? null : s.id))
                  }
                  onEstado={(next) => cambiarEstado(s, next)}
                  onConvertir={() => convertir(s)}
                  onEliminar={() => eliminar(s)}
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({
  s,
  open,
  busy,
  onToggle,
  onEstado,
  onConvertir,
  onEliminar,
}: {
  s: Solicitud;
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  onEstado: (next: string) => void;
  onConvertir: () => void;
  onEliminar: () => void;
}) {
  return (
    <>
      <tr className="align-top hover:bg-orange-50/30">
        <td className="px-4 py-3 whitespace-nowrap text-gray-500">
          {date(s.createdAt)}
        </td>
        <td className="px-4 py-3">
          {badge(s.tipo === "Cotizacion" ? "Cotización" : "Contacto", "purple")}
        </td>
        <td className="px-4 py-3">
          <p className="font-medium text-gray-900">{s.empresa || s.nombre}</p>
          {s.empresa && (
            <p className="text-xs text-gray-500">Contacto: {s.nombre}</p>
          )}
          {s.cliente && (
            <p className="text-xs text-emerald-600">→ {s.cliente.nombre}</p>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {s.email && (
            <a
              href={`mailto:${s.email}`}
              className="flex items-center gap-1 hover:text-orange-600"
            >
              <Mail className="h-3 w-3" />
              {s.email}
            </a>
          )}
          {s.telefono && (
            <a
              href={`tel:${s.telefono}`}
              className="mt-0.5 flex items-center gap-1 hover:text-orange-600"
            >
              <Phone className="h-3 w-3" />
              {s.telefono}
            </a>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {s.productoNombre || s.categoria || "—"}
        </td>
        <td className="px-4 py-3">
          <select
            value={s.estado}
            disabled={busy}
            onChange={(e) => onEstado(e.target.value)}
            className={selCls}
          >
            {ESTADOS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            {s.estado !== "Convertida" && (
              <button
                type="button"
                onClick={onConvertir}
                disabled={busy}
                title="Convertir en cliente"
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Cliente
              </button>
            )}
            <button
              type="button"
              onClick={onToggle}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Ver detalle"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50/60">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Mensaje
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {s.mensaje || "—"}
                </p>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                {(s.direccion || s.ciudad || s.codigoPostal) && (
                  <p>
                    <span className="text-gray-400">Dirección: </span>
                    {[s.direccion, s.ciudad, s.codigoPostal]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {s.categoria && (
                  <p>
                    <span className="text-gray-400">Categoría: </span>
                    {s.categoria}
                  </p>
                )}
                {s.atendidaAt && (
                  <p>
                    <span className="text-gray-400">Atendida: </span>
                    {date(s.atendidaAt)}
                  </p>
                )}
                {s.notas && (
                  <p>
                    <span className="text-gray-400">Notas: </span>
                    {s.notas}
                  </p>
                )}
                <button
                  type="button"
                  onClick={onEliminar}
                  disabled={busy}
                  className="mt-2 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  Eliminar solicitud
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
