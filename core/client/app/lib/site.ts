import type { Metadata } from "next";

// Datos del sitio público usados por los metadatos, el sitemap y los datos
// estructurados. SITE_URL se define en el build (ver docker/Dockerfile.client).

export const SITE_URL = (process.env.SITE_URL || "https://compipro.net").replace(/\/+$/, "");

export const EMPRESA = {
  nombre: "Compipro S.A.C.",
  descripcion:
    "Agencia peruana de merchandising: artículos y productos publicitarios personalizados con tu marca para eventos, ferias, regalos corporativos y la industria en general.",
  telefono: "+51932230880",
  email: "ventas@compipro.net",
  direccion: {
    calle: "Av. Las Flores de Primavera 184",
    distrito: "San Juan de Lurigancho",
    region: "Lima",
    pais: "PE",
  },
} as const;

// Imagen generada por app/opengraph-image.tsx.
const IMAGEN_COMPARTIR = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Compipro S.A.C. — Agencia de merchandising en Perú",
};

type MetaPagina = {
  path: string;
  title: string;
  description: string;
};

/** Metadatos de una página pública con su URL canónica propia. */
export function metaPagina({ path, title, description }: MetaPagina): Metadata {
  const tituloCompleto = `${title} | ${EMPRESA.nombre}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_PE",
      siteName: EMPRESA.nombre,
      url: path,
      title: tituloCompleto,
      description,
      images: [IMAGEN_COMPARTIR],
    },
    twitter: {
      card: "summary_large_image",
      title: tituloCompleto,
      description,
      images: [IMAGEN_COMPARTIR.url],
    },
  };
}
