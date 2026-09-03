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
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <LoaderCircle className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 md:flex">
      {/* Barra superior (solo móvil) */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-amber-200 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Abrir menú"
          className="rounded-md p-1.5 text-neutral-700 hover:bg-neutral-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-neutral-800">Sistema Compina</span>
      </header>

      <Sidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      <WelcomeModal />
      <AttendanceGate />
    </div>
  );
}
