"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, Lock, Menu } from "lucide-react";
import { sileo } from "sileo";
import { useAuth } from "@/app/hooks/useAuth";
import Sidebar from "../components/dashboard/Sidebar";
import WelcomeModal from "@/app/components/dashboard/WelcomeModal";
import AttendanceGate from "@/app/components/dashboard/AttendanceGate";
import { ConfirmarHost } from "@/app/components/dashboard/Confirmar";
import { MODULO_POR_RUTA, puede } from "@/app/lib/permisos";
import { avisoDespertando } from "@/app/lib/despertar";

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

/** Toast mientras el backend despierta (escala a cero en Azure) y "listo" cuando vuelve. */
function useAvisoDespertando(status: string) {
  const anterior = useRef(status);

  useEffect(() => {
    if (status !== "unavailable") return;
    const aviso = avisoDespertando();
    aviso.mostrar();
    return () => aviso.cerrar();
  }, [status]);

  useEffect(() => {
    if (anterior.current === "unavailable" && status === "authenticated") {
      sileo.success({ title: "Servidor listo" });
    }
    anterior.current = status;
  }, [status]);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const modulo = MODULO_POR_RUTA[pathname];
  const sinAcceso = !!modulo && !puede(user?.role, modulo, "leer");
  const [navOpen, setNavOpen] = useState(false);
  const zoom = useShellZoom();
  useAvisoDespertando(status);

  // Ruta protegida: sin sesión válida -> login.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  if (status === "unavailable") return <Reconectando />;

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
          {sinAcceso ? <SinAcceso /> : children}
        </main>
      </div>
      <WelcomeModal />
      <AttendanceGate />
      <ConfirmarHost />
    </div>
  );
}

// El backend no responde (arrancando o con la base de datos saliendo de pausa).
// useAuth reintenta solo; al responder, el panel aparece sin recargar.
function Reconectando() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-frame p-4">
      <div
        role="status"
        className="max-w-md rounded-[1.75rem] bg-panel p-8 text-center shadow-sm ring-1 ring-white"
      >
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ink text-white">
          <LoaderCircle className="size-6 animate-spin" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          Despertando la demo…
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Tras un rato sin visitas, el servidor y la base de datos se apagan para
          ahorrar recursos. Arrancar tarda hasta un minuto; seguimos intentando
          automáticamente.
        </p>
      </div>
    </div>
  );
}

function SinAcceso() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md rounded-[1.75rem] bg-panel p-8 text-center shadow-sm ring-1 ring-white">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ink text-white">
          <Lock className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          No tienes acceso a este módulo
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Tu rol no incluye esta sección. Si la necesitas, pide a un
          administrador que actualice tu rol.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:brightness-95"
        >
          Volver a Estadísticas
        </Link>
      </div>
    </div>
  );
}
