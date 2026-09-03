"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import ResourcePage, {
  type ResourceConfig,
} from "@/app/components/dashboard/ResourcePage";
import { badge, money } from "@/app/components/dashboard/cells";
import { crm } from "@/app/lib/crm";

type Producto = {
  id: number;
  sku: string;
  nombre: string;
  categoria: string | null;
  precio: number;
  stock: number;
  stockMinimo: number;
};

const config: ResourceConfig<Producto> = {
  resource: "productos",
  title: "Inventario",
  subtitle: "Stock, movimientos, alertas de bajo stock y valorización.",
  searchPlaceholder: "Buscar por nombre o SKU…",
  filters: [
    {
      name: "bajoStock",
      label: "Stock",
      options: [{ value: "true", label: "Bajo mínimo" }],
    },
  ],
  columns: [
    { key: "sku", label: "SKU", className: "font-mono text-xs" },
    { key: "nombre", label: "Producto", className: "font-medium text-gray-900" },
    { key: "categoria", label: "Categoría" },
    { key: "precio", label: "Precio", render: (r) => money(r.precio) },
    {
      key: "stock",
      label: "Stock",
      render: (r) =>
        r.stock <= r.stockMinimo
          ? badge(`${r.stock} ⚠`, "red")
          : badge(r.stock, "green"),
    },
    {
      key: "valor",
      label: "Valorización",
      render: (r) => money(r.precio * r.stock),
    },
  ],
  fields: [
    { name: "sku", label: "SKU", required: true, colSpan: 1 },
    { name: "categoria", label: "Categoría", colSpan: 1 },
    { name: "nombre", label: "Nombre", required: true },
    { name: "precio", label: "Precio", type: "number", step: "0.01", colSpan: 1 },
    { name: "stock", label: "Stock inicial", type: "number", colSpan: 1 },
    { name: "stockMinimo", label: "Stock mínimo", type: "number", colSpan: 1 },
  ],
};

export default function InventarioPage() {
  const [target, setTarget] = useState<Producto | null>(null);

  return (
    <>
      <ResourcePage
        config={{
          ...config,
          rowActions: [
            {
              label: "Movimiento",
              onClick: (row) => setTarget(row as Producto),
            },
          ],
        }}
      />
      {target && (
        <MovimientoModal
          producto={target}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            // recarga simple
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

function MovimientoModal({
  producto,
  onClose,
  onDone,
}: {
  producto: Producto;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tipo, setTipo] = useState("Entrada");
  const [cantidad, setCantidad] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await crm.action("movimientos-inventario", {
        productoId: producto.id,
        tipo,
        cantidad: Number(cantidad),
        motivo: motivo || null,
      });
      toast.success("Movimiento registrado");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-gray-900">
          Movimiento · {producto.nombre}
        </h2>
        <p className="text-xs text-gray-500">Stock actual: {producto.stock}</p>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="Entrada">Entrada</option>
          <option value="Salida">Salida</option>
          <option value="Ajuste">Ajuste (fijar stock a…)</option>
        </select>
        <input
          type="number"
          min="1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Cantidad"
        />
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Motivo (opcional)"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            Registrar
          </button>
        </div>
      </form>
    </div>
  );
}
