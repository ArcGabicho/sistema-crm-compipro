"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CircleHelp, Trash2 } from "lucide-react";

export type OpcionesConfirmar = {
  titulo: string;
  mensaje?: ReactNode;
  /** Texto del botón de confirmar (por defecto "Confirmar"). */
  confirmar?: string;
  cancelar?: string;
  /** Acción destructiva: botón rojo e ícono de papelera. */
  peligro?: boolean;
};

type Pendiente = OpcionesConfirmar & { resolver: (ok: boolean) => void };

let abrir: ((opciones: OpcionesConfirmar) => Promise<boolean>) | null = null;

/**
 * Reemplazo de window.confirm con el estilo del panel:
 * `if (!(await confirmar({ titulo: "¿Eliminar…?", peligro: true }))) return;`
 * Requiere <ConfirmarHost /> montado (lo está en el layout del dashboard).
 */
export function confirmar(opciones: OpcionesConfirmar): Promise<boolean> {
  return abrir ? abrir(opciones) : Promise.resolve(window.confirm(opciones.titulo));
}

export function ConfirmarHost() {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const actual = useRef<Pendiente | null>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const confirmarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    abrir = (opciones) =>
      new Promise<boolean>((resolver) => {
        actual.current?.resolver(false); // una confirmación nueva cancela la anterior
        actual.current = { ...opciones, resolver };
        setPendiente(actual.current);
      });
    return () => {
      abrir = null;
    };
  }, []);

  const cerrar = useCallback((ok: boolean) => {
    actual.current?.resolver(ok);
    actual.current = null;
    setPendiente(null);
  }, []);

  useEffect(() => {
    if (!pendiente) return;
    // En acciones destructivas el foco va a "Cancelar": un Enter distraído no borra nada.
    (pendiente.peligro ? cancelarRef : confirmarRef).current?.focus();
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar(false);
      }
    };
    document.addEventListener("keydown", teclas);
    return () => document.removeEventListener("keydown", teclas);
  }, [pendiente, cerrar]);

  if (!pendiente) return null;
  const { titulo, mensaje, peligro } = pendiente;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={() => cerrar(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        aria-describedby={mensaje ? "confirmar-mensaje" : undefined}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[1.75rem] bg-panel p-6 text-center shadow-2xl"
      >
        <span
          className={`mx-auto grid size-12 place-items-center rounded-full ${
            peligro ? "bg-red-100 text-red-600" : "bg-ink text-white"
          }`}
        >
          {peligro ? <Trash2 className="size-5" /> : <CircleHelp className="size-5" />}
        </span>
        <h2 id="confirmar-titulo" className="mt-4 text-lg font-semibold text-ink">
          {titulo}
        </h2>
        {mensaje && (
          <p id="confirmar-mensaje" className="mt-1.5 text-sm leading-relaxed text-neutral-500">
            {mensaje}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <button
            ref={cancelarRef}
            type="button"
            onClick={() => cerrar(false)}
            className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm ring-1 ring-neutral-200/70 transition-colors hover:bg-frame focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {pendiente.cancelar ?? "Cancelar"}
          </button>
          <button
            ref={confirmarRef}
            type="button"
            onClick={() => cerrar(true)}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus-visible:ring-2 ${
              peligro
                ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-300"
                : "bg-accent hover:brightness-95 focus-visible:ring-accent/40"
            }`}
          >
            {pendiente.confirmar ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
