import { NextResponse } from "next/server";
import { categorias, getCategoriaById } from "./data";

// API que reemplaza la antigua API en Go (GET /api/data) que estaba caída en
// Railway (https://go-compipro-api-production.up.railway.app/api/data).
//
//   GET /api/products         -> todas las categorías con sus productos
//   GET /api/products?id=<id> -> una sola categoría (404 si no existe)

export function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    const categoria = getCategoriaById(id);
    if (!categoria) {
      return NextResponse.json(
        { error: `Categoría "${id}" no encontrada` },
        { status: 404 },
      );
    }
    return NextResponse.json(categoria);
  }

  return NextResponse.json(categorias);
}