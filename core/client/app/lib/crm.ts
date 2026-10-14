// Cliente tipado de la API del CRM (a través del proxy autenticado /api/crm).
import { ServidorNoDisponible } from "./auth";
import { mientrasDespierta } from "./despertar";

export type Paged<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

function qs(params?: QueryParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function errorDe(res: Response): Promise<Error> {
  const data = (await res.json().catch(() => null)) as unknown;
  const message =
    data && typeof data === "object" && "message" in data
      ? String((data as { message: unknown }).message)
      : res.status === 403
        ? "No tienes permiso para realizar esta acción."
        : res.status === 429
          ? "Demasiadas solicitudes. Espera un momento."
          : res.status >= 502 && res.status <= 504
            ? "El servidor no responde en este momento. Inténtalo de nuevo en unos minutos."
            : `Error ${res.status}`;
  return res.status >= 502 && res.status <= 504
    ? new ServidorNoDisponible(message, res.status)
    : new Error(message);
}

// Tras ~5 min sin peticiones el backend escala a cero: la siguiente lo despierta.
const DORMIDO_TRAS_MS = 4.5 * 60_000;
let ultimaRespuesta = Date.now();

/**
 * Hace la petición y, si el servidor está despertando, reintenta con un aviso.
 * Un 503 llega antes de procesar nada; un 502/504 puede llegar después, así que
 * solo se repite en las lecturas (GET).
 */
function pedir<T>(method: string, intento: () => Promise<T>): Promise<T> {
  const dormido = Date.now() - ultimaRespuesta > DORMIDO_TRAS_MS;
  return mientrasDespierta(
    intento,
    (e) => e instanceof ServidorNoDisponible && (method === "GET" || e.status === 503),
    dormido ? undefined : null,
  );
}

async function fetchCrm(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(`/api/crm/${path}`, { ...init, cache: "no-store" });
  ultimaRespuesta = Date.now();
  if (!res.ok) throw await errorDe(res);
  return res;
}

function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const isForm = body instanceof FormData;
  return pedir(method, async () => {
    const res = await fetchCrm(path, {
      method,
      headers:
        body !== undefined && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined as T;
    return (await res.json().catch(() => null)) as T;
  });
}

/** Nombre del archivo según Content-Disposition (prefiere filename*=UTF-8''…). */
function nombreArchivo(res: Response, fallback: string): string {
  const cd = res.headers.get("content-disposition") ?? "";
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd);
  if (utf8) return decodeURIComponent(utf8[1]);
  const plano = /filename="?([^";]+)"?/i.exec(cd);
  return plano ? plano[1] : fallback;
}

/** Descarga un archivo del CRM (Excel, CSV, PDF, documentos) y lo guarda en el equipo. */
async function download(path: string, fallback = "archivo"): Promise<void> {
  const res = await pedir("GET", () => fetchCrm(path, {}));

  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo(res, fallback);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const crm = {
  list: <T>(resource: string, params?: QueryParams) =>
    request<Paged<T>>("GET", `${resource}${qs(params)}`),
  get: <T>(resource: string, id: number | string) =>
    request<T>("GET", `${resource}/${id}`),
  create: <T>(resource: string, data: unknown) =>
    request<T>("POST", resource, data),
  update: <T>(resource: string, id: number | string, data: unknown) =>
    request<T>("PUT", `${resource}/${id}`, data),
  remove: (resource: string, id: number | string) =>
    request<void>("DELETE", `${resource}/${id}`),
  action: <T>(path: string, data?: unknown) => request<T>("POST", path, data),
  stats: <T>(name: string) => request<T>("GET", `stats/${name}`),
  /** Envía un formulario multipart (subida de archivos). */
  upload: <T>(path: string, form: FormData) => request<T>("POST", path, form),
  download,
  /** Exporta un recurso a Excel o CSV con los mismos filtros del listado. */
  exportar: (resource: string, formato: "xlsx" | "csv", params?: QueryParams) =>
    download(`${resource}/exportar${qs({ ...params, formato })}`, `${resource}.${formato}`),
  /** GET a una ruta arbitraria del CRM (p. ej. "email/estado"). */
  consulta: <T>(path: string) => request<T>("GET", path),
};
