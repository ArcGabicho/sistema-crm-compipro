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

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`/api/crm/${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `Error ${res.status}`;
    throw new Error(message);
  }
  return data as T;
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
};
