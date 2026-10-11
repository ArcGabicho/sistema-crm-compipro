"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

const IMAGES = [
  "/images/img_welcome.jpg",
  "/images/img_welcome2.jpg",
  "/images/img_welcome3.jpg",
];

// Se muestra una vez por sesión del navegador (reaparece tras un nuevo login).
const SESSION_KEY = "dash_welcome_seen";

function initialState(): { open: boolean; image: string } {
  const image = IMAGES[Math.floor(Math.random() * IMAGES.length)];
  if (typeof window === "undefined") return { open: false, image };
  try {
    return { open: window.sessionStorage.getItem(SESSION_KEY) !== "1", image };
  } catch {
    return { open: true, image };
  }
}

export default function WelcomeModal() {
  const [{ open, image }, setState] = useState(initialState);

  const close = () => {
    setState((prev) => ({ ...prev, open: false }));
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* almacenamiento no disponible */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={close}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] bg-panel shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-16/10 w-full">
          <Image
            src={image}
            alt="Bienvenida"
            fill
            sizes="512px"
            priority
            className="object-cover"
          />
        </div>

        <div className="p-6 text-center">
          <h2 id="welcome-title" className="text-xl font-semibold text-ink">
            ¡Bienvenido al Sistema CRM!
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Nos alegra tenerte de vuelta. Usa el menú lateral para navegar entre
            los módulos.
          </p>
          <button
            type="button"
            onClick={close}
            className="mt-5 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:brightness-95"
          >
            Comenzar
          </button>
        </div>
      </div>
    </div>
  );
}
