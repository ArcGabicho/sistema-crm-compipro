import { NextResponse } from "next/server";
import { BACKEND_URL, cabecerasCliente } from "@/app/lib/backend";

// POST /api/leads — formularios públicos del sitio (sin autenticación).
// Reenvía al backend .NET: POST /api/public/solicitudes
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (
    !body ||
    typeof body.nombre !== "string" ||
    body.nombre.trim().length < 2
  ) {
    return NextResponse.json({ message: "Indica tu nombre." }, { status: 400 });
  }
  if (
    (typeof body.email !== "string" || body.email.trim() === "") &&
    (typeof body.telefono !== "string" || body.telefono.trim() === "")
  ) {
    return NextResponse.json(
      { message: "Indica un correo o un teléfono de contacto." },
      { status: 400 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/public/solicitudes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...cabecerasCliente(request) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo enviar. Inténtalo más tarde." },
      { status: 502 },
    );
  }

  const data = (await backendRes.json().catch(() => null)) as {
    message?: string;
  } | null;

  if (!backendRes.ok) {
    return NextResponse.json(
      { message: data?.message ?? "No se pudo enviar la solicitud." },
      { status: backendRes.status || 400 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
