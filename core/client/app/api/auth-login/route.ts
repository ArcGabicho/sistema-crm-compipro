import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/app/lib/session";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5008";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo contactar el servidor de autenticación." },
      { status: 502 },
    );
  }

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
