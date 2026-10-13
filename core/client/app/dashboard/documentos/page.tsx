"use client";

import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { LoaderCircle, Upload, X } from "lucide-react";
import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { date } from "@/app/components/dashboard/cells";
import { crm } from "@/app/lib/crm";
import { usePermiso } from "@/app/lib/permisos";

type Documento = {
  id: number;
  nombre: string;
  carpeta: string;
  tipo: string | null;
  tamanoBytes: number;
  version: number;
  url: string | null;
  createdAt: string;
};

const CARPETAS = [
  "Comercial",
  "Legal",
  "Calidad",
  "Marketing",
  "Eventos",
  "Reportes",
  "General",
].map((v) => ({ value: v, label: v }));

// Vercel limita el cuerpo de cada petición a 4,5 MB; el backend acepta hasta 4 MB.
const MAX_BYTES = 4 * 1024 * 1024;

const kb = (b: number) =>
  b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`;

const tieneArchivo = (d: Documento) => !!d.url?.startsWith("archivo:");
const esEnlace = (d: Documento) => /^https?:\/\//i.test(d.url ?? "");

async function descargar(d: Documento) {
  if (esEnlace(d)) {
    window.open(d.url!, "_blank", "noopener");
    return;
  }
  try {
    await crm.download(`documentos/${d.id}/descargar`, d.nombre);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "No se pudo descargar");
  }
}

/** Abre el selector de archivos y sube el elegido (nuevo documento o nueva versión). */
function elegirArchivo(onFile: (file: File) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = () => input.files?.[0] && onFile(input.files[0]);
  input.click();
}

async function subir(file: File, extra: Record<string, string>) {
  if (file.size > MAX_BYTES) throw new Error("El archivo supera el máximo de 4 MB.");
  const form = new FormData();
  form.append("archivo", file);
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return crm.upload<Documento>("documentos/subir", form);
}

export default function DocumentosPage() {
  const permiso = usePermiso("documentos");
  const [subiendo, setSubiendo] = useState<{ reload: () => void } | null>(null);

  const config: ResourceConfig<Documento> = {
    resource: "documentos",
    title: "Documentos",
    subtitle: "Repositorio de archivos por carpeta, con control de versiones.",
    searchPlaceholder: "Buscar documento…",
    canCreate: false,
    filters: [{ name: "carpeta", label: "Carpeta", options: CARPETAS }],
    headerActions: (reload) =>
      permiso.escribir && (
        <button
          type="button"
          onClick={() => setSubiendo({ reload })}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-95"
        >
          <Upload className="h-4 w-4" />
          Subir archivo
        </button>
      ),
    columns: [
      {
        key: "nombre",
        label: "Nombre",
        className: "font-medium text-ink",
        render: (r) => (
          <span className="flex items-center gap-2">
            {r.nombre}
            {!tieneArchivo(r) && !esEnlace(r) && (
              <span className="rounded-full bg-neutral-200/70 px-2 py-0.5 text-[11px] font-normal text-neutral-500">
                sin archivo
              </span>
            )}
          </span>
        ),
      },
      { key: "carpeta", label: "Carpeta" },
      { key: "tipo", label: "Tipo", render: (r) => r.tipo?.toUpperCase() ?? "—" },
      { key: "version", label: "Versión", render: (r) => `v${r.version}` },
      { key: "tamanoBytes", label: "Tamaño", render: (r) => kb(r.tamanoBytes) },
      { key: "createdAt", label: "Creado", render: (r) => date(r.createdAt) },
    ],
    fields: [
      { name: "nombre", label: "Nombre del archivo", required: true },
      { name: "carpeta", label: "Carpeta", type: "select", options: CARPETAS },
    ],
    rowActions: [
      {
        label: "Descargar",
        acceso: "leer",
        visible: (r) => tieneArchivo(r) || esEnlace(r),
        onClick: (r) => descargar(r),
      },
      {
        label: "Nueva versión",
        onClick: (r, reload) =>
          elegirArchivo(async (file) => {
            const id = toast.loading(`Subiendo ${file.name}…`);
            try {
              const doc = await subir(file, { documentoId: String(r.id) });
              toast.success(`Versión ${doc.version} subida`, { id });
              reload();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "No se pudo subir", { id });
            }
          }),
      },
    ],
  };

  return (
    <>
      <ResourcePage config={config} />
      {subiendo && (
        <SubirModal
          onClose={() => setSubiendo(null)}
          onDone={() => {
            subiendo.reload();
            setSubiendo(null);
          }}
        />
      )}
    </>
  );
}

function SubirModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [carpeta, setCarpeta] = useState("General");
  const [saving, setSaving] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const elegir = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("El archivo supera el máximo de 4 MB.");
      return;
    }
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    try {
      await subir(file, { carpeta });
      toast.success("Archivo subido");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir");
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
          <h2 className="text-lg font-semibold text-ink">Subir archivo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-neutral-400 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              elegir(e.dataTransfer.files?.[0]);
            }}
            className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              arrastrando ? "border-accent bg-accent/10" : "border-neutral-300 bg-white hover:border-accent"
            }`}
          >
            <Upload className="h-6 w-6 text-neutral-400" />
            {file ? (
              <>
                <span className="text-sm font-medium text-ink">{file.name}</span>
                <span className="text-xs text-neutral-500">{kb(file.size)} · clic para cambiar</span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-ink">Arrastra un archivo o haz clic</span>
                <span className="text-xs text-neutral-500">PDF, Word, Excel, imágenes… hasta 4 MB</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => elegir(e.target.files?.[0])}
          />

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Carpeta</span>
            <select
              value={carpeta}
              onChange={(e) => setCarpeta(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            >
              {CARPETAS.map((c) => (
                <option key={c.value}>{c.value}</option>
              ))}
            </select>
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
            disabled={!file || saving}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
          >
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Subir
          </button>
        </div>
      </form>
    </div>
  );
}
