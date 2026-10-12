"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Menu } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import Sidebar from "../components/dashboard/Sidebar";
import WelcomeModal from "@/app/components/dashboard/WelcomeModal";
import AttendanceGate from "@/app/components/dashboard/AttendanceGate";

// Altura mínima (px) para la que está diseñado el panel de escritorio sin scroll.
// Si la ventana útil es más baja (barra del navegador, barra de tareas), el panel
// se reduce proporcionalmente en lugar de generar scroll.
const DESIGN_HEIGHT = 700;
const MIN_ZOOM = 0.7;

function useShellZoom() {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      const next = desktop.matches
        ? Math.min(1, Math.max(MIN_ZOOM, window.innerHeight / DESIGN_HEIGHT))
        : 1;
      setZoom(Math.round(next * 1000) / 1000);
    };
    update();
    window.addEventListener("resize", update);
    desktop.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      desktop.removeEventListener("change", update);
    };
  }, []);

  return zoom;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const zoom = useShellZoom();

  // Ruta protegida: sin sesión válida -> login.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-frame">
        <LoaderCircle className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-frame lg:h-dvh lg:overflow-hidden">
      <div
        style={zoom < 1 ? { zoom } : undefined}
        className="min-h-dvh lg:flex lg:h-full lg:min-h-0 lg:gap-4 lg:p-4"
      >
        {/* Barra superior (solo móvil) */}
        <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-3 bg-frame/90 pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menú"
            className="grid size-9 place-items-center rounded-full bg-panel text-ink shadow-sm ring-1 ring-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-ink">Sistema Compipro</span>
        </header>

        <Sidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />

        <main className="min-w-0 flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:overflow-y-auto lg:rounded-[1.75rem] lg:p-2">
          {children}
        </main>
      </div>
      <WelcomeModal />
      <AttendanceGate />
    </div>
  );
}
