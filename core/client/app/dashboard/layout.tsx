"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Menu } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import Sidebar from "../components/dashboard/Sidebar";
import WelcomeModal from "@/app/components/dashboard/WelcomeModal";
import AttendanceGate from "@/app/components/dashboard/AttendanceGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  // Ruta protegida: sin sesión válida -> login.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-frame">
        <LoaderCircle className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-frame md:flex md:h-screen md:min-h-0 md:gap-4 md:p-4">
      {/* Barra superior (solo móvil) */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-frame/90 px-4 backdrop-blur md:hidden">
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

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:overflow-y-auto md:rounded-[1.75rem] md:p-2">
        {children}
      </main>
      <WelcomeModal />
      <AttendanceGate />
    </div>
  );
}
