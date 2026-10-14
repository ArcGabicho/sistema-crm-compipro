import { NextResponse } from "next/server";
import { BACKEND_URL, cabecerasCliente } from "@/app/lib/backend";

// GET /api/estado → { listo }: el backend responde y su base de datos está lista.
// La web lo usa para despertar el servidor por adelantado (escala a cero en Azure).
export async function GET(request: Request) {
  try {
    const res = await fetch(`${BACKEND_URL}/`, {
      headers: cabecerasCliente(request),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await res.json().catch(() => null)) as { status?: string } | null;
    return NextResponse.json({ listo: res.ok && data?.status === "ok" });
  } catch {
    return NextResponse.json({ listo: false });
  }
}
