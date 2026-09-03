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

/** Devuelve el usuario de la sesión vigente, o null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await fetch("/api/auth-me", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as CurrentUser;
  } catch {
    return null;
  }
}
