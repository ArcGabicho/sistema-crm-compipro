// Cliente tipado de la API del CRM (a través del proxy autenticado /api/crm).

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
        : `Error ${res.status}`;
  return new Error(message);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(`/api/crm/${path}`, {
    method,
    headers:
      body !== undefined && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) throw await errorDe(res);
  if (res.status === 204) return undefined as T;
  return (await res.json().catch(() => null)) as T;
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
  const res = await fetch(`/api/crm/${path}`, { cache: "no-store" });
  if (!res.ok) throw await errorDe(res);

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
