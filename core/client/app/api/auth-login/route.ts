import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/app/lib/session";
import { BACKEND_URL, cabecerasCliente } from "@/app/lib/backend";

/** El backend no responde (caído, reiniciando o detrás de un 502 de Cloudflare): no es un error de credenciales. */
function noDisponible() {
  return NextResponse.json(
    { message: "El servidor de la demo no responde en este momento. Vuelve a intentarlo en unos minutos." },
    { status: 503 },
  );
}

// POST /api/auth-login  { email, password }
// Reenvía al backend .NET, y si autentica, guarda el JWT en una cookie HttpOnly.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: "El correo y la contraseña son obligatorios." },
      { status: 400 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...cabecerasCliente(request) },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });
  } catch {
    return noDisponible();
  }
  if (backendRes.status >= 500) return noDisponible();

  const data = (await backendRes.json().catch(() => null)) as
    | {
        token: string;
        email: string;
        name: string;
        role: string;
        expiresAt: string;
      }
    | { message?: string }
    | null;

  if (!backendRes.ok || !data || !("token" in data)) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Credenciales inválidas.";
    return NextResponse.json({ message }, { status: backendRes.status || 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(data.expiresAt),
  });

  return NextResponse.json({
    email: data.email,
    name: data.name,
    role: data.role,
  });
}
