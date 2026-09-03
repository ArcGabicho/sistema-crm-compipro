"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import { crm, type Paged } from "@/app/lib/crm";
import { useAuth } from "@/app/hooks/useAuth";
import { badge, date, estadoTone } from "@/app/components/dashboard/cells";

type Registro = {
  id: number;
  userId: number;
  user?: { id: number; name: string } | null;
  fecha: string;
  horaProgramada: string;
  horaIngreso: string;
  minutosTardanza: number;
  minutosAnticipacion: number;
  tarde: boolean;
  estado: string;
  justificacion: string | null;
};

type Usuario = { id: number; name: string };

const hhmm = (t: string) => (t ? t.slice(0, 5) : "—");

export default function AsistenciaPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState<Paged<Registro> | null>(null);
  const [loading, setLoading] = useState(true);
  const [soloTarde, setSoloTarde] = useState(false);
  const [userId, setUserId] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [justificar, setJustificar] = useState<Registro | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancel = false;
    void (async () => {
      try {
        const d = await crm.list<Usuario>("usuarios", { pageSize: 100 });
        if (!cancel) setUsuarios(d.items);
      } catch {
        /* filtro opcional */
      }
    })();
    return () => {
      cancel = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      setLoading(true);
      try {
        const d = await crm.list<Registro>("asistencia", {
          pageSize: 100,
          soloTarde: soloTarde || undefined,
          userId: userId || undefined,
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
  }, [soloTarde, userId, tick]);

  const tardanzas = data?.items.filter((r) => r.tarde).length ?? 0;

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
        <p className="text-sm text-gray-500">
          Ingreso registrado al entrar al sistema frente a la hora programada de
          cada trabajador (tolerancia 5 min).
          {tardanzas > 0 && (
            <span className="font-medium text-red-600">
              {" "}
              {tardanzas} tardanza{tardanzas === 1 ? "" : "s"} en la vista.
            </span>
          )}
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={soloTarde}
            onChange={(e) => setSoloTarde(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-orange-500"
          />
          Solo tardanzas
        </label>
        {isAdmin && (
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todo el personal</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {["Fecha", "Trabajador", "Programada", "Ingreso", "Desvío", "Estado", "Justificación", ""].map(
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
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  Sin registros de asistencia.
                </td>
              </tr>
            )}
            {!loading &&
              data?.items.map((r) => (
                <tr key={r.id} className="align-top hover:bg-orange-50/30">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {date(r.fecha)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.user?.name ?? `#${r.userId}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {hhmm(r.horaProgramada)}
                  </td>
                  <td className="px-4 py-3">{hhmm(r.horaIngreso)}</td>
                  <td className="px-4 py-3">
                    {r.minutosTardanza > 0 ? (
                      <span className="font-medium text-red-600">
                        +{r.minutosTardanza} min
                      </span>
                    ) : r.minutosAnticipacion > 0 ? (
                      <span className="text-gray-400">
                        −{r.minutosAnticipacion} min
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {badge(r.estado, estadoTone(r.estado))}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-xs text-gray-600">
                    {r.justificacion ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.tarde && r.estado !== "Justificada" && (
                      <button
                        type="button"
                        onClick={() => setJustificar(r)}
                        className="rounded px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50"
                      >
                        Justificar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {justificar && (
        <JustificarModal
          registro={justificar}
          onClose={() => setJustificar(null)}
          onDone={() => {
            setJustificar(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function JustificarModal({
  registro,
  onClose,
  onDone,
}: {
  registro: Registro;
  onClose: () => void;
  onDone: () => void;
}) {
  const [texto, setTexto] = useState(registro.justificacion ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (texto.trim().length < 5) return;
    setSaving(true);
    try {
      await crm.action(`asistencia/${registro.id}/justificar`, {
        texto: texto.trim(),
      });
      toast.success("Tardanza justificada");
      onDone();
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Error");
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
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div>
          <h2 className="text-lg font-bold text-gray-900">Justificar tardanza</h2>
          <p className="mt-1 text-sm text-gray-500">
            {registro.user?.name} · {date(registro.fecha)} ·{" "}
            <span className="font-semibold text-red-600">
              +{registro.minutosTardanza} min
            </span>
          </p>
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          autoFocus
          required
          minLength={5}
          placeholder="Motivo de la tardanza…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
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
            disabled={saving || texto.trim().length < 5}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
