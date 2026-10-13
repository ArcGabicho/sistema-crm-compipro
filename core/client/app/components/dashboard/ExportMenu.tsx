"use client";

import { useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import { Download, FileSpreadsheet, FileText, LoaderCircle } from "lucide-react";
import { crm, type QueryParams } from "@/app/lib/crm";

const FORMATOS = [
  { formato: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet },
  { formato: "csv", label: "CSV (.csv)", icon: FileText },
] as const;

/** Botón "Exportar" con menú Excel/CSV. Exporta respetando los filtros recibidos. */
export default function ExportMenu({
  resource,
  params,
}: {
  resource: string;
  params?: QueryParams;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const exportar = async (formato: "xlsx" | "csv") => {
    setOpen(false);
    setBusy(true);
    try {
      await crm.exportar(resource, formato, params);
    } catch (e) {
      sileo.error({ title: "No se pudo exportar", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full bg-panel px-4 py-2.5 text-sm text-ink shadow-sm ring-1 ring-white transition-colors hover:bg-white disabled:opacity-60"
      >
        {busy ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {busy ? "Exportando…" : "Exportar"}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl bg-white p-1 shadow-lg ring-1 ring-neutral-200/70"
        >
          {FORMATOS.map(({ formato, label, icon: Icon }) => (
            <button
              key={formato}
              type="button"
              role="menuitem"
              onClick={() => exportar(formato)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-frame"
            >
              <Icon className="h-4 w-4 text-neutral-500" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
