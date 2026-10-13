"use client";

import { useCallback, useEffect, useState } from "react";
import { sileo } from "sileo";
import { CalendarDays, LoaderCircle, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, date } from "@/app/components/dashboard/cells";
import { crm } from "@/app/lib/crm";
import { usePermiso } from "@/app/lib/permisos";

type Evento = {
  id: number;
  nombre: string;
  ubicacion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
};

type Participante = {
  id: number;
  eventoId: number;
  nombre: string;
  rol: string | null;
  stand: string | null;
  asistio: boolean;
};

const ROLES = ["Cliente", "Proveedor", "Staff"].map((v) => ({ value: v, label: v }));

const inp =
  "w-full rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

function rango(e: Evento): string {
  if (!e.fechaInicio) return "Sin fecha";
  if (!e.fechaFin || e.fechaFin === e.fechaInicio) return date(e.fechaInicio);
  return `${date(e.fechaInicio)} – ${date(e.fechaFin)}`;
}

/** Próximo / En curso / Finalizado, según las fechas del evento. */
function etapa(e: Evento): { label: string; tone: "green" | "yellow" | "gray" } | null {
  if (!e.fechaInicio) return null;
  const d = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fin = e.fechaFin ?? e.fechaInicio;
  if (hoy < e.fechaInicio) return { label: "Próximo", tone: "yellow" };
  if (hoy > fin) return { label: "Finalizado", tone: "gray" };
  return { label: "En curso", tone: "green" };
}

export default function EventosPage() {
  const permiso = usePermiso("eventos");
  const [eventos, setEventos] = useState<Evento[] | null>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [editando, setEditando] = useState<Evento | "nuevo" | null>(null);
  const [tick, setTick] = useState(0);

  const recargar = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let activo = true;
    crm
      .list<Evento>("eventos", { pageSize: 100 })
      .then((res) => {
        if (!activo) return;
        setEventos(res.items);
        setSeleccion((actual) =>
          actual && res.items.some((e) => e.id === actual) ? actual : (res.items[0]?.id ?? null),
        );
      })
      .catch((e) => sileo.error({ title: "No se pudieron cargar los eventos", description: e instanceof Error ? e.message : undefined }));
    return () => {
      activo = false;
    };
  }, [tick]);

  const evento = eventos?.find((e) => e.id === seleccion) ?? null;

  const eliminar = async (e: Evento) => {
    if (!window.confirm(`¿Eliminar el evento «${e.nombre}» y sus participantes?`)) return;
    try {
      await crm.remove("eventos", e.id);
      sileo.success({ title: "Evento eliminado" });
      setSeleccion(null);
      recargar();
    } catch (err) {
      sileo.error({ title: "No se pudo eliminar", description: err instanceof Error ? err.message : undefined });
    }
  };

  const participantes: ResourceConfig<Participante> | null = evento && {
    resource: "participantes",
    title: "Participantes",
    subtitle: `${evento.nombre} · stands y control de asistencia.`,
    searchPlaceholder: "Buscar participante…",
    fixedParams: { eventoId: evento.id },
    filters: [{ name: "rol", label: "Rol", options: ROLES }],
    columns: [
      { key: "nombre", label: "Participante", className: "font-medium text-ink" },
      { key: "rol", label: "Rol", render: (r) => badge(r.rol, "blue") },
      { key: "stand", label: "Stand" },
      {
        key: "asistio",
        label: "Asistencia",
        render: (r) => (r.asistio ? badge("Asistió", "green") : badge("Pendiente", "gray")),
      },
    ],
    fields: [
      { name: "nombre", label: "Nombre", required: true },
      { name: "rol", label: "Rol", type: "select", options: ROLES, colSpan: 1 },
      { name: "stand", label: "Stand", placeholder: "A3", colSpan: 1 },
      { name: "asistio", label: "Asistencia", type: "checkbox", placeholder: "Asistió" },
    ],
  };

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Eventos</h1>
          <p className="text-sm text-neutral-500">
            Ferias, activaciones y lanzamientos: participantes, stands y asistencia.
          </p>
        </div>
        {permiso.escribir && (
          <button
            type="button"
            onClick={() => setEditando("nuevo")}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </button>
        )}
      </header>

      {/* Eventos */}
      <div className="-mx-1 mb-5 flex shrink-0 gap-3 overflow-x-auto px-1 pb-1">
        {eventos === null && (
          <div className="grid h-28 w-full place-items-center text-neutral-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
          </div>
        )}
        {eventos?.length === 0 && (
          <div className="w-full rounded-[1.75rem] bg-panel px-6 py-8 text-center text-sm text-neutral-500 shadow-sm ring-1 ring-white">
            Aún no hay eventos. {permiso.escribir && "Crea el primero con «Nuevo evento»."}
          </div>
        )}
        {eventos?.map((e) => {
          const activo = e.id === seleccion;
          const et = etapa(e);
          return (
            <div
              key={e.id}
              role="button"
              tabIndex={0}
              onClick={() => setSeleccion(e.id)}
              onKeyDown={(k) => (k.key === "Enter" || k.key === " ") && setSeleccion(e.id)}
              aria-pressed={activo}
              className={`group relative flex w-64 shrink-0 cursor-pointer flex-col gap-2 rounded-[1.5rem] p-4 text-left shadow-sm ring-1 transition-colors ${
                activo ? "bg-ink text-white ring-ink" : "bg-panel text-ink ring-white hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2 font-semibold">{e.nombre}</span>
                {et && badge(et.label, activo && et.tone === "gray" ? "purple" : et.tone)}
              </div>
              <span className={`flex items-center gap-1.5 text-xs ${activo ? "text-white/70" : "text-neutral-500"}`}>
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                {rango(e)}
              </span>
              <span className={`flex items-center gap-1.5 text-xs ${activo ? "text-white/70" : "text-neutral-500"}`}>
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{e.ubicacion ?? "Sin ubicación"}</span>
              </span>
              {activo && (permiso.escribir || permiso.eliminar) && (
                <div className="mt-1 flex gap-1">
                  {permiso.escribir && (
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setEditando(e);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs hover:bg-white/20"
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                  )}
                  {permiso.eliminar && (
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        void eliminar(e);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs hover:bg-red-500/80"
                    >
                      <Trash2 className="h-3 w-3" /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {participantes && (
        <div className="lg:min-h-0 lg:flex-1">
          <ResourcePage key={evento!.id} config={participantes} />
        </div>
      )}

      {editando && (
        <EventoModal
          evento={editando === "nuevo" ? null : editando}
          onClose={() => setEditando(null)}
          onSaved={(e) => {
            setEditando(null);
            setSeleccion(e.id);
            recargar();
          }}
        />
      )}
    </div>
  );
}

function EventoModal({
  evento,
  onClose,
  onSaved,
}: {
  evento: Evento | null;
  onClose: () => void;
  onSaved: (e: Evento) => void;
}) {
  const [form, setForm] = useState({
    nombre: evento?.nombre ?? "",
    ubicacion: evento?.ubicacion ?? "",
    fechaInicio: evento?.fechaInicio ?? "",
    fechaFin: evento?.fechaFin ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
      sileo.error({ title: "La fecha de fin no puede ser anterior al inicio." });
      return;
    }
    setSaving(true);
    const payload = {
      ...evento,
      nombre: form.nombre.trim(),
      ubicacion: form.ubicacion.trim() || null,
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,
    };
    try {
      const guardado = evento
        ? await crm.update<Evento>("eventos", evento.id, payload)
        : await crm.create<Evento>("eventos", payload);
      sileo.success({ title: evento ? "Evento actualizado" : "Evento creado" });
      onSaved(guardado);
    } catch (err) {
      sileo.error({ title: "No se pudo guardar", description: err instanceof Error ? err.message : undefined });
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.75rem] bg-panel shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200/70 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">{evento ? "Editar evento" : "Nuevo evento"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-neutral-400 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5">
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">
              Nombre <span className="text-red-500">*</span>
            </span>
            <input
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Feria Expo Merchandising 2026"
              className={inp}
            />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Ubicación</span>
            <input
              value={form.ubicacion}
              onChange={(e) => set("ubicacion", e.target.value)}
              placeholder="Centro de Convenciones de Lima"
              className={inp}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Inicio</span>
            <input
              type="date"
              value={form.fechaInicio}
              onChange={(e) => set("fechaInicio", e.target.value)}
              className={inp}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Fin</span>
            <input
              type="date"
              value={form.fechaFin}
              min={form.fechaInicio || undefined}
              onChange={(e) => set("fechaFin", e.target.value)}
              className={inp}
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
          >
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
