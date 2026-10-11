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

  const displayName = user?.name || user?.email || "Usuario";

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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-3 bg-frame p-3 transition-transform duration-300 md:static md:z-auto md:h-full md:shrink-0 md:translate-x-0 md:bg-transparent md:p-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[4.5rem]" : "md:w-64"}`}
      >
        {/* Usuario */}
        <div
          className={`flex items-center gap-3 rounded-full bg-panel p-1.5 shadow-sm ring-1 ring-white ${
            collapsed ? "md:justify-center" : ""
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
              collapsed ? "md:hidden" : ""
            }`}
          >
            {displayName}
          </span>
        </div>

        {/* Navegación */}
        <div className="relative flex min-h-0 flex-1 flex-col rounded-[1.75rem] bg-panel p-3 shadow-sm ring-1 ring-white">
          <div className="flex h-10 items-center gap-3 px-1.5 pb-2">
            <Image
              src="/images/logocompina.webp"
              alt="Compipro"
              width={412}
              height={117}
              priority
              className={`h-5 w-auto shrink-0 ${collapsed ? "md:hidden" : ""}`}
            />
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              className="ml-auto hidden size-8 shrink-0 items-center justify-center rounded-full bg-white text-neutral-500 shadow-sm transition-colors hover:text-ink md:flex"
            >
              <ChevronsLeft
                className={`size-4 transition-transform duration-300 ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <nav className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1 py-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-full p-1.5 text-sm transition-all ${
                    active
                      ? "bg-white font-medium text-ink shadow-sm"
                      : "text-neutral-500 hover:text-ink"
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors ${
                      active
                        ? "bg-ink text-white"
                        : "group-hover:bg-white/80"
                    }`}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span
                    className={`truncate pr-3 ${collapsed ? "md:hidden" : ""}`}
                  >
                    {label}
                  </span>
                </Link>
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
          <span className={`truncate pr-3 ${collapsed ? "md:hidden" : ""}`}>
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </span>
        </button>
      </aside>
    </>
  );
}
