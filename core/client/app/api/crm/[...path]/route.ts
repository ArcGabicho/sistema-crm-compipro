import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/app/lib/session";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5008";

// Proxy autenticado: /api/crm/<lo-que-sea>  ->  <BACKEND_URL>/api/<lo-que-sea>
// Añade el JWT de la cookie HttpOnly como Bearer. El navegador nunca ve el token.
async function forward(req: Request, path: string[]): Promise<Response> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: "No autenticado." }, { status: 401 });
  }

  const { search } = new URL(req.url);
  const target = `${BACKEND_URL}/api/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const method = req.method.toUpperCase();
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
    body = await req.text();
    if (body) headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(target, { method, headers, body, cache: "no-store" });
  } catch {
    return Response.json({ message: "Backend no disponible." }, { status: 502 });
  }

  const text = await res.text();
  return new Response(text || null, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function POST(req: Request, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function PUT(req: Request, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function PATCH(req: Request, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function DELETE(req: Request, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
