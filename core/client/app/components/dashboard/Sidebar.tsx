"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ClipboardList,
  Clock,
  Factory,
  FileText,
  Files,
  Funnel,
  Gauge,
  Headset,
  IdCard,
  Inbox,
  LayoutGrid,
  LoaderCircle,
  LogOut,
  Mail,
  NotebookText,
  Package,
  Tags,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Estadísticas", icon: Gauge },
  { href: "/dashboard/solicitudes", label: "Solicitudes web", icon: Inbox },
  { href: "/dashboard/pipeline", label: "Pipeline comercial", icon: LayoutGrid },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/dashboard/status-atencion", label: "Status de Atención", icon: Headset },
  { href: "/dashboard/tipos-cliente", label: "Tipos de Cliente", icon: Tags },
  { href: "/dashboard/proveedores", label: "Proveedores", icon: Factory },
  { href: "/dashboard/logistica", label: "Logística", icon: Truck },
  { href: "/dashboard/administracion", label: "Administración", icon: NotebookText },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: IdCard },
  { href: "/dashboard/asistencia", label: "Asistencia", icon: Clock },
  { href: "/dashboard/documentos", label: "Documentos", icon: Files },
  { href: "/dashboard/email", label: "Programar - Enviar Email", icon: Mail },
  { href: "/dashboard/feria-resmine-2024", label: "Feria Resmine 2024", icon: Funnel },
  { href: "/dashboard/inventario", label: "Inventario", icon: Package },
];

type SidebarProps = {
  /** Menú abierto en móvil (< md). En escritorio el aside siempre es visible. */
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Cierre de sesión con navegación "dura": borra la cookie en el servidor y
  // recarga en /auth. Evita la carrera entre este handler y el guard del
  // layout del dashboard llamando ambos a router.replace("/auth"), que dejaba
  // el spinner colgado. Una recarga completa además descarta todo el estado.
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      window.location.href = "/auth";
    }
  };

  return (
    <>
      {/* Fondo oscuro al abrir el menú en móvil */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-neutral-800 text-neutral-300 transition-transform duration-300 md:sticky md:top-0 md:z-30 md:shrink-0 md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-64"}`}
      >
        {/* Encabezado */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <Image
            src="/images/logocompina.webp"
            alt="Compipro"
            width={412}
            height={117}
            priority
            className="h-6 w-auto shrink-0 brightness-0 invert"
          />
          {!collapsed && (
            <span className="truncate font-semibold text-white">Sistema Compina</span>
          )}
        </div>

        {/* Botón de colapso (solo escritorio) */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="absolute -right-3 top-14 hidden h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-neutral-900 shadow-md transition-colors hover:bg-yellow-300 md:flex"
        >
          <ChevronsLeft
            className={`h-4 w-4 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Navegación */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto py-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-yellow-400 bg-white/10 text-white"
                    : "border-transparent hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Pie: usuario / cerrar sesión */}
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Cerrar sesión" : undefined}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            {loggingOut ? (
              <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 shrink-0" />
            )}
            {!collapsed && (
              <span className="truncate">
                {loggingOut
                  ? "Cerrando sesión…"
                  : user
                    ? `Salir · ${user.name || user.email}`
                    : "Cerrar sesión"}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}