"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Mail } from "lucide-react";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/productos", label: "Productos" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/contacto", label: "Contacto" },
];

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 top-4 z-50 px-4 sm:top-6">
      <div
        className={`mx-auto max-w-6xl rounded-full px-3 ring-1 ring-white backdrop-blur-md transition-all duration-300 sm:px-4 ${
          isScrolled
            ? "bg-panel/70 shadow-lg"
            : "bg-panel/95 shadow-md"
        }`}
      >
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="shrink-0 pl-2">
            <Link href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/web/logonavbar.webp"
                alt="Logo"
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-white text-ink shadow-sm"
                    : "text-neutral-500 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact Info - Desktop */}
          <div className="hidden lg:flex items-center gap-2 pr-1">
            <a
              href="tel:+51932230880"
              className="flex items-center rounded-full bg-white px-3 py-2 text-xs font-medium text-ink shadow-sm transition-colors duration-200 hover:bg-ink hover:text-white"
            >
              <Phone className="w-3 h-3 mr-2 shrink-0" />
              (51) 932 230 880
            </a>
            <a
              href="mailto:ventas@compipro.net"
              className="flex items-center rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:brightness-95"
            >
              <Mail className="w-3 h-3 mr-2 shrink-0" />
              ventas@compipro.net
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={toggleMobileMenu}
              className="grid size-10 place-items-center rounded-full bg-white text-ink shadow-sm transition-colors duration-200 hover:bg-ink hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {isMobileMenuOpen ? (
                <X className="block h-5 w-5" />
              ) : (
                <Menu className="block h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`mx-auto max-w-6xl lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "mt-2 max-h-[28rem] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="space-y-1 rounded-[1.75rem] bg-panel/95 p-3 shadow-lg ring-1 ring-white backdrop-blur-md">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`block rounded-full px-4 py-2.5 text-base font-medium transition-colors duration-200 ${
                isActive(link.href)
                  ? "bg-white text-ink shadow-sm"
                  : "text-neutral-600 hover:bg-white/70 hover:text-ink"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Contact Info - Mobile */}
          <div className="space-y-1 border-t border-neutral-200/70 pt-3">
            <a
              href="tel:+51932230880"
              className="flex items-center rounded-full px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-200 hover:bg-white/70"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Phone className="w-4 h-4 mr-3 shrink-0" />
              (51) 932 230 880
            </a>
            <a
              href="mailto:ventas@compipro.net"
              className="flex items-center rounded-full px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-200 hover:bg-white/70"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Mail className="w-4 h-4 mr-3 shrink-0" />
              ventas@compipro.net
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
