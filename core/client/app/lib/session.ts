// Constantes compartidas entre las rutas /api/auth-* y proxy.ts.

/** Nombre de la cookie HttpOnly que guarda el JWT de sesión. */
export const SESSION_COOKIE = "crm_session";

/** Claims que el backend .NET pone en el JWT. */
export const JWT_ISSUER = "compipro-crm";
export const JWT_AUDIENCE = "compipro-crm-client";
