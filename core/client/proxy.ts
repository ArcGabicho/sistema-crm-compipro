import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  JWT_AUDIENCE,
  JWT_ISSUER,
  SESSION_COOKIE,
} from "@/app/lib/session";

// Next 16: el archivo de middleware se llama `proxy.ts` y exporta `proxy`.

const secret = new TextEncoder().encode(process.env.AUTH_JWT_SECRET ?? "");

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || secret.length === 0) return false;
  try {
    await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await hasValidSession(request);

  // /dashboard/* requiere sesión válida.
  if (pathname.startsWith("/dashboard") && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Con sesión válida, /auth redirige al panel.
  if (pathname === "/auth" && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth"],
};