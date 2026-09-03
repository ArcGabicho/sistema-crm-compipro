import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/app/lib/session";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5008";

// GET /api/auth-me  -> usuario de la sesión actual (o 401).
// Lee la cookie HttpOnly y valida el token contra el backend .NET.
export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Servidor de autenticación no disponible." },
      { status: 502 },
    );
  }

  if (!backendRes.ok) {
    // Token expirado o inválido: limpiamos la cookie.
    const response = NextResponse.json(
      { message: "Sesión inválida." },
      { status: 401 },
    );
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.json(await backendRes.json());
}
