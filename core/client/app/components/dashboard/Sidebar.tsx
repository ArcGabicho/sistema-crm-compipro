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
  CalendarDays,
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
import { MODULO_POR_RUTA, puede } from "@/app/lib/permisos";
import CuentaModal from "./CuentaModal";

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
  { href: "/dashboard/eventos", label: "Eventos", icon: CalendarDays },
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
  const [cuenta, setCuenta] = useState(false);
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

  const displayName = user?.name || user?.email || "Usuario";

  return (
    <>
      {/* Fondo oscuro al abrir el menú en móvil */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-3 bg-frame p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] transition-transform duration-300 lg:static lg:z-auto lg:h-full lg:shrink-0 lg:translate-x-0 lg:bg-transparent lg:p-0 lg:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[4.5rem]" : "lg:w-64"}`}
      >
        {/* Usuario (abre "Mi cuenta") */}
        <button
          type="button"
          onClick={() => setCuenta(true)}
          title="Mi cuenta · cambiar contraseña"
          className={`flex items-center gap-3 rounded-full bg-panel p-1.5 text-left shadow-sm ring-1 ring-white transition-colors hover:bg-white ${
            collapsed ? "lg:justify-center" : ""
          }`}
        >
          <Image
            src="/images/Avatar.webp"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-full object-cover"
          />
          <span
            className={`truncate pr-3 text-sm font-medium text-ink ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            {displayName}
          </span>
        </button>

        {/* Navegación */}
        <div className="relative flex min-h-0 flex-1 flex-col rounded-[1.75rem] bg-panel p-3 shadow-sm ring-1 ring-white">
          <div className="flex h-10 items-center gap-3 px-1.5 pb-2">
            <Image
              src="/images/Compipro_Logo.webp"
              alt="Compipro"
              width={412}
              height={117}
              priority
              className={`h-6 w-auto shrink-0 ${collapsed ? "lg:hidden" : ""}`}
            />
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              className="ml-auto hidden size-8 shrink-0 items-center justify-center rounded-full bg-white text-neutral-500 shadow-sm transition-colors hover:text-ink lg:flex"
            >
              <ChevronsLeft
                className={`size-4 transition-transform duration-300 ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Cada ítem crece para repartir el alto libre del panel (con tope), sin generar scroll */}
          <nav className="-mx-1 flex flex-1 flex-col overflow-y-auto px-1 py-1">
            {NAV.filter(({ href }) => {
              const modulo = MODULO_POR_RUTA[href];
              return !modulo || puede(user?.role, modulo, "leer");
            }).map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <div key={href} className="flex max-h-16 flex-[1_0_auto] items-center">
                <Link
                  href={href}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-full p-[var(--nav-pad)] text-[13px] transition-all [@media(min-height:850px)]:text-sm ${
                    active
                      ? "bg-white font-medium text-ink shadow-sm"
                      : "text-neutral-500 hover:text-ink"
                  }`}
                >
                  <span
                    className={`grid size-[var(--nav-icon)] shrink-0 place-items-center rounded-full transition-colors ${
                      active
                        ? "bg-ink text-white"
                        : "group-hover:bg-white/80"
                    }`}
                  >
                    <Icon className="size-[clamp(1rem,calc(var(--nav-icon)*0.55),1.25rem)]" />
                  </span>
                  <span
                    className={`truncate pr-3 ${collapsed ? "lg:hidden" : ""}`}
                  >
                    {label}
                  </span>
                </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Cerrar sesión */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Cerrar sesión" : undefined}
          className="group flex items-center gap-3 rounded-full bg-panel p-1.5 text-sm text-neutral-500 shadow-sm ring-1 ring-white transition-colors hover:text-ink disabled:cursor-wait disabled:opacity-60"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white">
            {loggingOut ? (
              <LoaderCircle className="size-[18px] animate-spin" />
            ) : (
              <LogOut className="size-[18px]" />
            )}
          </span>
          <span className={`truncate pr-3 ${collapsed ? "lg:hidden" : ""}`}>
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </span>
        </button>
      </aside>
      {cuenta && <CuentaModal onClose={() => setCuenta(false)} />}
    </>
  );
}
