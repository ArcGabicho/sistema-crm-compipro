"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type CurrentUser,
} from "../lib/auth";

// "unavailable": el backend no responde; la sesión se vuelve a consultar sola.
type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable";

// Pausa entre consultas mientras el backend arranca o Azure SQL sale de pausa.
const REINTENTO_MS = 3000;

type AuthContextValue = {
  user: CurrentUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
      setStatus(current ? "authenticated" : "unauthenticated");
    } catch {
      /* servidor no disponible: se conserva el estado actual */
    }
  }, []);

  // Hidrata la sesión al montar (consulta /api/auth-me, que lee la cookie).
  // Si el backend aún no responde, reintenta hasta que lo haga.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hydrate = async () => {
      try {
        const current = await getCurrentUser();
        if (!active) return;
        setUser(current);
        setStatus(current ? "authenticated" : "unauthenticated");
      } catch {
        if (!active) return;
        setStatus("unavailable");
        timer = setTimeout(hydrate, REINTENTO_MS);
      }
    };
    void hydrate();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const current = await loginRequest(email, password);
    setUser(current);
    setStatus("authenticated");
    return current;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refresh }),
    [user, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Estado de sesión compartido. Debe usarse dentro de <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  }
  return context;
}
