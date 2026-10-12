// Cliente de autenticación. Habla SOLO con las rutas /api/auth-* de Next
// (mismo origen). El JWT vive en una cookie HttpOnly que este código no puede
// leer: la maneja el servidor de Next (ver app/api/auth-*/route.ts y proxy.ts).

export type CurrentUser = {
  email: string;
  name: string;
  role: string;
};

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function messageOf(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    return String((data as { message: unknown }).message);
  }
  return fallback;
}

/** Inicia sesión. El servidor de Next fija la cookie de sesión HttpOnly. */
export async function login(
  email: string,
  password: string,
): Promise<CurrentUser> {
  let response: Response;
  try {
    response = await fetch("/api/auth-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  const data = await parseJson(response);
  if (!response.ok) {
    throw new Error(messageOf(data, "No se pudo iniciar sesión."));
  }
  return data as CurrentUser;
}

/** Cierra sesión: el servidor de Next borra la cookie. */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth-logout", { method: "POST" });
  } catch {
    /* aunque falle la red, el estado local se limpia en useAuth */
  }
}

/** El backend no respondió (arrancando, caído o con la base de datos en pausa). */
export class ServidorNoDisponible extends Error {
  constructor() {
    super("No se pudo conectar con el servidor.");
  }
}

/**
 * Devuelve el usuario de la sesión vigente, o null si no hay sesión.
 * Lanza ServidorNoDisponible si el backend no responde: eso no significa que
 * la sesión sea inválida, así que no hay que mandar al usuario al login.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  let response: Response;
  try {
    response = await fetch("/api/auth-me", { cache: "no-store" });
  } catch {
    throw new ServidorNoDisponible();
  }
  if (response.status >= 500) throw new ServidorNoDisponible();
  if (!response.ok) return null;
  return (await response.json()) as CurrentUser;
}
