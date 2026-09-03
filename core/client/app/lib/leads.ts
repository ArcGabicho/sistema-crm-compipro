// Envío de los formularios públicos del sitio (cotización / contacto) al CRM.
// Habla solo con la ruta same-origin /api/leads, que reenvía al backend .NET.

export type LeadInput = {
  tipo: "Cotizacion" | "Contacto";
  nombre: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  mensaje?: string;
  productoNombre?: string;
  categoria?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
};

export async function submitLead(input: LeadInput): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("No se pudo conectar. Revisa tu conexión.");
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(data?.message ?? "No se pudo enviar la solicitud.");
  }
}
