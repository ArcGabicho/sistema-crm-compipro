import type { Metadata } from "next";
import { categorias, getCategoriaById } from "@/app/api/products/data";
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
  return {
    title: catData
      ? `${catData.nombre} | Compipro S.A.C.`
      : "Categoría no encontrada | Compipro S.A.C.",
  };
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
