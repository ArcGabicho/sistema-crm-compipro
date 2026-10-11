"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { crm, type Paged } from "@/app/lib/crm";

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "date"
  | "time"
  | "checkbox";

export type Option = { value: string | number; label: string };

export type Field = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: Option[];
  /** Carga las opciones desde otro recurso del CRM. */
  optionsResource?: string;
  optionsLabelKey?: string;
  placeholder?: string;
  step?: string;
  colSpan?: 1 | 2;
};

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export type Filter = { name: string; label: string; options: Option[] };

export type RowAction<T> = {
  label: string;
  onClick: (row: T, reload: () => void) => void | Promise<void>;
};

export type ResourceConfig<T> = {
  resource: string;
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  fields: Field[];
  filters?: Filter[];
  searchPlaceholder?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  rowActions?: RowAction<T>[];
  pageSize?: number;
};

type WithId = { id: number };

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";
const pillCls =
  "rounded-full bg-panel px-4 py-2.5 text-sm text-ink shadow-sm ring-1 ring-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40";

export default function ResourcePage<T extends WithId>({
  config,
}: {
  config: ResourceConfig<T>;
}) {
  const pageSize = config.pageSize ?? 15;
  const canCreate = config.canCreate ?? true;
  const canEdit = config.canEdit ?? true;
  const canDelete = config.canDelete ?? true;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [data, setData] = useState<Paged<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [asyncOptions, setAsyncOptions] = useState<Record<string, Option[]>>({});
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await crm.list<T>(config.resource, {
          page,
          pageSize,
          search: debounced || undefined,
          ...filterValues,
        });
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.resource, page, pageSize, debounced, filterValues, reloadTick]);

  // Opciones asíncronas de los campos del formulario
  useEffect(() => {
    const toLoad = config.fields.filter((f) => f.optionsResource);
    if (toLoad.length === 0) return;
    let active = true;
    Promise.all(
      toLoad.map(async (f) => {
        const res = await crm.list<Record<string, unknown>>(f.optionsResource!, {
          pageSize: 200,
        });
        const key = f.optionsLabelKey ?? "nombre";
        return [
          f.name,
          res.items.map((it) => ({
            value: Number(it.id),
            label: String(it[key] ?? it.id),
          })),
        ] as const;
      }),
    ).then((entries) => {
      if (active) setAsyncOptions(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = async (row: T) => {
    if (!window.confirm(`¿Eliminar el registro #${row.id}?`)) return;
    try {
      await crm.remove(config.resource, row.id);
      toast.success("Eliminado");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  };

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {config.title}
          </h1>
          {config.subtitle && (
            <p className="text-sm text-neutral-500">{config.subtitle}</p>
          )}
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </button>
        )}
      </header>

      {/* Barra de herramientas */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={config.searchPlaceholder ?? "Buscar…"}
          className={`${pillCls} w-full max-w-xs`}
        />
        {config.filters?.map((f) => (
          <select
            key={f.name}
            value={filterValues[f.name] ?? ""}
            onChange={(e) => {
              setFilterValues((prev) => ({ ...prev, [f.name]: e.target.value }));
              setPage(1);
            }}
            className={`${pillCls} w-auto`}
          >
            <option value="">{f.label}: todos</option>
            {f.options.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-[1.75rem] bg-panel shadow-sm ring-1 ring-white lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-neutral-200/70 bg-frame text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              {config.columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/60">
            {loading && (
              <tr>
                <td
                  colSpan={config.columns.length + 1}
                  className="px-4 py-10 text-center text-neutral-400"
                >
                  <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={config.columns.length + 1}
                  className="px-4 py-10 text-center text-sm text-red-500"
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && data?.items.length === 0 && (
              <tr>
                <td
                  colSpan={config.columns.length + 1}
                  className="px-4 py-10 text-center text-sm text-neutral-400"
                >
                  Sin registros.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              data?.items.map((row) => (
                <tr key={row.id} className="hover:bg-white/60">
                  {config.columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 text-neutral-700 ${c.className ?? ""}`}
                    >
                      {c.render
                        ? c.render(row)
                        : String(
                            (row as Record<string, unknown>)[c.key] ?? "—",
                          )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {config.rowActions?.map((a) => (
                        <button
                          key={a.label}
                          type="button"
                          onClick={() => a.onClick(row, reload)}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-ink hover:text-white"
                        >
                          {a.label}
                        </button>
                      ))}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          aria-label="Editar"
                          className="rounded-full p-1.5 text-neutral-400 hover:bg-white hover:text-neutral-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          aria-label="Eliminar"
                          className="rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-3 flex shrink-0 items-center justify-between text-sm text-neutral-500">
        <span>
          {from}–{to} de {total}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full bg-panel px-4 py-1.5 shadow-sm ring-1 ring-white disabled:opacity-40 enabled:hover:bg-white"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full bg-panel px-4 py-1.5 shadow-sm ring-1 ring-white disabled:opacity-40 enabled:hover:bg-white"
          >
            Siguiente
          </button>
        </div>
      </div>

      {editing !== null && (
        <FormModal
          config={config}
          asyncOptions={asyncOptions}
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

function FormModal<T extends WithId>({
  config,
  record,
  asyncOptions,
  onClose,
  onSaved,
}: {
  config: ResourceConfig<T>;
  record: T | null;
  asyncOptions: Record<string, Option[]>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = useMemo(() => {
    const base: Record<string, unknown> = {};
    for (const f of config.fields) {
      const current = record
        ? (record as Record<string, unknown>)[f.name]
        : undefined;
      if (f.type === "checkbox") base[f.name] = Boolean(current);
      else if (current === null || current === undefined) base[f.name] = "";
      else if (f.type === "date")
        base[f.name] = String(current).slice(0, 10);
      else base[f.name] = current;
    }
    return base;
  }, [config.fields, record]);

  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const [saving, setSaving] = useState(false);

  const set = (name: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      const v = form[f.name];
      if (f.type === "checkbox") payload[f.name] = Boolean(v);
      else if (f.type === "number" || f.optionsResource)
        payload[f.name] = v === "" || v === null ? null : Number(v);
      else payload[f.name] = v === "" ? null : v;
    }
    try {
      if (record) await crm.update<T>(config.resource, record.id, payload);
      else await crm.create<T>(config.resource, payload);
      toast.success(record ? "Actualizado" : "Creado");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.75rem] bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200/70 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">
            {record ? `Editar ${config.title}` : `Nuevo · ${config.title}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-neutral-400 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2"
        >
          {config.fields.map((f) => {
            const opts = f.optionsResource
              ? (asyncOptions[f.name] ?? [])
              : (f.options ?? []);
            const span = f.colSpan === 1 ? "sm:col-span-1" : "sm:col-span-2";
            return (
              <div key={f.name} className={span}>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>

                {f.type === "textarea" ? (
                  <textarea
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => set(f.name, e.target.value)}
                    required={f.required}
                    rows={3}
                    className={`${inputCls} resize-y`}
                  />
                ) : f.type === "select" || f.optionsResource ? (
                  <select
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => set(f.name, e.target.value)}
                    required={f.required}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {opts.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 pt-1 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={Boolean(form[f.name])}
                      onChange={(e) => set(f.name, e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-200 text-accent focus:ring-accent/25"
                    />
                    {f.placeholder ?? "Sí"}
                  </label>
                ) : (
                  <input
                    type={f.type ?? "text"}
                    step={f.step}
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => set(f.name, e.target.value)}
                    required={f.required}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                )}
              </div>
            );
          })}

          <div className="col-span-2 mt-1 flex justify-end gap-2">
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
    </div>
  );
}
