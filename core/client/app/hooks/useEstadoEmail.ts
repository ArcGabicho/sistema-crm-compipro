"use client";

import { useEffect, useState } from "react";
import { crm } from "@/app/lib/crm";

export type EstadoEmail = {
  real: boolean;
  /** simulado: no sale nada · sandbox: llega a la bandeja de pruebas · smtp: envío real */
  modo: "simulado" | "sandbox" | "smtp";
  remitente: string;
  seguimiento: boolean;
  /** Bandeja del sandbox filtrada por este proyecto. */
  bandeja: string | null;
};

// Se consulta una vez por sesión del navegador: la configuración no cambia en caliente.
let cache: Promise<EstadoEmail | null> | null = null;

/** Modo de envío de correos del backend (para avisos y enlaces a la bandeja). */
export function useEstadoEmail(): EstadoEmail | null {
  const [estado, setEstado] = useState<EstadoEmail | null>(null);

  useEffect(() => {
    let activo = true;
    cache ??= crm.consulta<EstadoEmail>("email/estado").catch(() => {
      cache = null; // reintenta en el próximo montaje
      return null;
    });
    void cache.then((e) => activo && setEstado(e));
    return () => {
      activo = false;
    };
  }, []);

  return estado;
}

/** Abre una URL de la bandeja en otra pestaña. */
export const abrirEnPestana = (url: string) => window.open(url, "_blank", "noopener");
