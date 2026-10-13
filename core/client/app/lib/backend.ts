// Utilidades de las rutas /api/* de Next (BFF) para hablar con el backend .NET.

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5008";

/**
 * Identifica al visitante ante el backend para los límites por IP. El BFF llama
 * desde los servidores de Vercel; sin esto, todos compartirían la IP de Vercel.
 * El backend solo confía en X-Cliente-IP si X-BFF-Clave coincide con su secreto.
 * En Vercel, x-real-ip / x-forwarded-for los pone la plataforma (no el cliente).
 */
export function cabecerasCliente(req: Request): Record<string, string> {
  const clave = process.env.BFF_CLAVE;
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return clave && ip ? { "X-Cliente-IP": ip, "X-BFF-Clave": clave } : {};
}
