"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, KeyRound, LoaderCircle, X } from "lucide-react";
import { crm } from "@/app/lib/crm";
import { useAuth } from "@/app/hooks/useAuth";
import { ROLES } from "@/app/lib/permisos";

const MINIMO = 8;
const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 pr-10 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

/** Datos de la sesión y cambio de la propia contraseña. */
export default function CuentaModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [ver, setVer] = useState(false);
  const [saving, setSaving] = useState(false);

  const rol = ROLES.find((r) => r.value === user?.role)?.label ?? "Sin rol asignado";
  const error =
    nueva && nueva.length < MINIMO
      ? `Mínimo ${MINIMO} caracteres.`
      : confirmar && nueva !== confirmar
        ? "Las contraseñas no coinciden."
        : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error || !actual || !nueva) return;
    setSaving(true);
    try {
      await crm.action("auth/cambiar-contrasena", { actual, nueva });
      toast.success("Contraseña actualizada");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
      setSaving(false);
    }
  };

  const campo = (label: string, value: string, set: (v: string) => void, auto: string) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      <div className="relative">
        <input
          type={ver ? "text" : "password"}
          value={value}
          onChange={(e) => set(e.target.value)}
          autoComplete={auto}
          required
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? "Ocultar contraseñas" : "Mostrar contraseñas"}
          className="absolute inset-y-0 right-2 grid place-items-center px-1 text-neutral-400 hover:text-neutral-600"
        >
          {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.75rem] bg-panel shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200/70 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Mi cuenta</h2>
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
          <div className="rounded-2xl bg-white px-4 py-3 text-sm">
            <p className="font-medium text-ink">{user?.name}</p>
            <p className="text-neutral-500">{user?.email}</p>
            <p className="mt-1 text-xs text-neutral-400">Rol: {rol}</p>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <KeyRound className="h-4 w-4 text-accent" />
            Cambiar contraseña
          </div>
          {campo("Contraseña actual", actual, setActual, "current-password")}
          {campo("Nueva contraseña", nueva, setNueva, "new-password")}
          {campo("Repite la nueva contraseña", confirmar, setConfirmar, "new-password")}
          {error && <p className="text-xs text-red-500">{error}</p>}
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
            disabled={saving || !!error || !actual || !nueva || !confirmar}
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
