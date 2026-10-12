import type { MetadataRoute } from "next";
import { categorias } from "@/app/api/products/data";
import { SITE_URL } from "@/app/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

  const paginas: MetadataRoute.Sitemap = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/productos", changeFrequency: "weekly", priority: 0.9 },
    { path: "/catalogo", changeFrequency: "weekly", priority: 0.9 },
    { path: "/nosotros", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contacto", changeFrequency: "monthly", priority: 0.8 },
  ].map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: ahora,
    changeFrequency: changeFrequency as "weekly" | "monthly",
    priority,
  }));

  const lineas: MetadataRoute.Sitemap = categorias.map((c) => ({
    url: `${SITE_URL}/${c.id}`,
    lastModified: ahora,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...paginas, ...lineas];
}
