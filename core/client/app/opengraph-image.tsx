import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { categorias } from "@/app/api/products/data";
import { SITE_URL } from "@/app/lib/site";

// Imagen de vista previa al compartir el sitio (LinkedIn, WhatsApp, Facebook…).
export const alt = "Compipro S.A.C. — Agencia de merchandising en Perú";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const totalProductos = new Set(categorias.flatMap((c) => c.productos.map((p) => p.id))).size;

const foto = async (ruta: string) =>
  `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public", ruta))).toString("base64")}`;

export default async function Image() {
  const [fotoA, fotoB] = await Promise.all([
    foto("assets/tecnologicos/blueto-speaker.jpg"),
    foto("assets/premium/set-ejecutivo.jpg"),
  ]);
  const dominio = new URL(SITE_URL).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#151515",
          padding: 56,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 680 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#ffa62b",
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              Agencia de merchandising
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 30, fontSize: 76, fontWeight: 700, lineHeight: 1.04 }}>
              <span>Merchandising</span>
              <span style={{ color: "#ffa62b" }}>con tu marca</span>
            </div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 30, color: "rgba(255,255,255,0.8)" }}>
              Artículos publicitarios personalizados para empresas
            </div>
            <div style={{ display: "flex", marginTop: 14, fontSize: 24, color: "rgba(255,255,255,0.55)" }}>
              {`+${totalProductos} productos · ${categorias.length} líneas · Todo el Perú`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
              <span>c</span>
              <span style={{ color: "#ffa62b" }}>o</span>
              <span>mpi</span>
              <span style={{ color: "#ffa62b" }}>pro</span>
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.6)" }}>{dominio}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 18, marginLeft: 28, justifyContent: "center" }}>
          {[fotoA, fotoB].map((src, i) => (
            <div
              key={src.slice(-24)}
              style={{
                display: "flex",
                width: 300,
                height: 240,
                alignSelf: i === 1 ? "flex-end" : "flex-start",
                background: "white",
                borderRadius: 36,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img src={src} width={300} height={240} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 16 }} />
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
