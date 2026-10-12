import type { Metadata } from "next";
import { categorias, getCategoriaById } from "@/app/api/products/data";
import { metaPagina } from "@/app/lib/site";
import ProductoView from "./ProductoView";

export function generateStaticParams() {
  return categorias.map((categoria) => ({ producto: categoria.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ producto: string }>;
}): Promise<Metadata> {
  const { producto } = await params;
  const catData = getCategoriaById(producto);
  if (!catData) {
    return { title: "Categoría no encontrada", robots: { index: false, follow: true } };
  }
  const total = catData.productos.length;
  return metaPagina({
    path: `/${catData.id}`,
    title: catData.nombre,
    description: `${catData.descripcion}: ${total} productos listos para personalizar con el logo de tu empresa. Cotiza tu pedido con Compipro.`,
  });
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ producto: string }>;
}) {
  const { producto } = await params;
  const catData = getCategoriaById(producto) ?? null;

  if (!catData) {
    return (
      <p className="max-w-7xl mx-auto px-4 py-32 text-center text-lg text-neutral-600">
        Categoría no encontrada.
      </p>
    );
  }

  return <ProductoView catData={catData} productos={catData.productos} />;
}
