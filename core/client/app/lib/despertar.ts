// El backend, Mailpit y Azure SQL se apagan tras un rato sin uso (escalan a cero en
// Azure) y tardan hasta un minuto en arrancar. Aquí se avisa con Sileo mientras
// despiertan, en vez de dejar al usuario esperando sin explicación.
import { sileo } from "sileo";

const LIMITE_MS = 120_000;
const PAUSA_MS = 4_000;
/** Si la respuesta tarda más que esto, lo más probable es que el servidor esté arrancando. */
const AVISO_TRAS_MS = 1_500;
const DESCRIPCION = "Tras un rato sin uso se apaga para ahorrar recursos; arrancar tarda hasta un minuto.";

export const DESPERTANDO_SERVIDOR = "Despertando el servidor…";
const DESPERTANDO_CORREO = "Despertando el servidor de correo…";

const pausa = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Un solo toast por título, aunque varias esperas lo pidan a la vez.
const abiertos = new Map<string, { id: string; usos: number }>();

/** Toast de carga compartido: aparece con la primera espera y se cierra con la última. */
export function avisoDespertando(titulo = DESPERTANDO_SERVIDOR) {
  let abierto = false;
  return {
    mostrar() {
      if (abierto) return;
      abierto = true;
      const actual = abiertos.get(titulo);
      if (actual) actual.usos++;
      else abiertos.set(titulo, {
        id: sileo.show({ type: "loading", title: titulo, description: DESCRIPCION, duration: null }),
        usos: 1,
      });
    },
    visible: () => abierto,
    cerrar() {
      if (!abierto) return;
      abierto = false;
      const actual = abiertos.get(titulo);
      if (actual && --actual.usos === 0) {
        sileo.dismiss(actual.id);
        abiertos.delete(titulo);
      }
    },
  };
}

/**
 * Repite `intento` mientras `despertando(error)` diga que el servidor aún no responde.
 * Con `avisarTras` (ms) el toast aparece también si la primera respuesta se demora:
 * la plataforma retiene la petición mientras arranca el contenedor. `null` = solo al fallar.
 */
export async function mientrasDespierta<T>(
  intento: () => Promise<T>,
  despertando: (error: unknown) => boolean,
  avisarTras: number | null = AVISO_TRAS_MS,
): Promise<T> {
  const limite = Date.now() + LIMITE_MS;
  const aviso = avisoDespertando();
  const temprano = avisarTras === null ? undefined : setTimeout(aviso.mostrar, avisarTras);
  try {
    for (;;) {
      try {
        return await intento();
      } catch (error) {
        if (!despertando(error) || Date.now() > limite) throw error;
        aviso.mostrar();
        await pausa(PAUSA_MS);
      }
    }
  } finally {
    clearTimeout(temprano);
    aviso.cerrar();
  }
}

const enCurso = new Map<string, Promise<boolean>>();

/** Despierta un servidor por adelantado; si tarda, avisa hasta que responda y luego dice que está listo. */
function despertar(titulo: string, listo: string, ping: () => Promise<boolean>): Promise<boolean> {
  let promesa = enCurso.get(titulo);
  if (!promesa) {
    promesa = esperarListo(titulo, listo, ping).finally(() => enCurso.delete(titulo));
    enCurso.set(titulo, promesa);
  }
  return promesa;
}

async function esperarListo(titulo: string, listo: string, ping: () => Promise<boolean>): Promise<boolean> {
  const limite = Date.now() + LIMITE_MS;
  const aviso = avisoDespertando(titulo);
  const temprano = setTimeout(aviso.mostrar, AVISO_TRAS_MS);
  try {
    for (;;) {
      if (await ping().catch(() => false)) {
        if (aviso.visible()) sileo.success({ title: listo });
        return true;
      }
      aviso.mostrar();
      if (Date.now() > limite) {
        sileo.warning({
          title: "Servidor no disponible",
          description: "No respondió a tiempo. Vuelve a intentarlo en unos minutos.",
        });
        return false;
      }
      await pausa(PAUSA_MS);
    }
  } finally {
    clearTimeout(temprano);
    aviso.cerrar();
  }
}

/** Backend arriba y con su base de datos lista (al abrir el login). */
export const despertarServidor = () =>
  despertar(DESPERTANDO_SERVIDOR, "Servidor listo", async () => {
    const res = await fetch("/api/estado", { cache: "no-store" });
    return ((await res.json()) as { listo?: boolean }).listo === true;
  });

/** Bandeja de pruebas (Mailpit) arriba, antes de enviar correos. */
export const despertarCorreo = () =>
  despertar(DESPERTANDO_CORREO, "Servidor de correo listo", async () =>
    (await fetch("/api/crm/email/despertar", { cache: "no-store" })).ok,
  );
