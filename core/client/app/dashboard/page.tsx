"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Coins,
  FileText,
  Headset,
  Inbox,
  Package,
  Percent,
  Factory,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { crm } from "@/app/lib/crm";
import { badge, estadoTone, money } from "@/app/components/dashboard/cells";

type Overview = {
  clientes: number;
  clientesActivos: number;
  ingresosTotales: number;
  ingresosMes: number;
  ingresosMesAnterior: number;
  variacionMensualPct: number;
  ticketsAbiertos: number;
  productos: number;
  productosBajoStock: number;
  enviosEnCurso: number;
  documentos: number;
  proveedores: number;
  cotizacionesMes: number;
  cotizacionesAprobadasMes: number;
  tasaConversionPct: number;
  valorPipeline: number;
  pedidosEnProduccion: number;
  pedidosAtrasados: number;
  porCobrar: number;
  solicitudesNuevas: number;
};

type MesPunto = { periodo: string; total: number; cantidad: number };
type EstadoPunto = { estado: string; cantidad: number };
type CotMesPunto = {
  periodo: string;
  enviadas: number;
  aprobadas: number;
  montoAprobado: number;
};

export default function EstadisticasPage() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [serie, setSerie] = useState<MesPunto[]>([]);
  const [cotSerie, setCotSerie] = useState<CotMesPunto[]>([]);
  const [clientesEstado, setClientesEstado] = useState<EstadoPunto[]>([]);
  const [ticketsEstado, setTicketsEstado] = useState<EstadoPunto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      crm.stats<Overview>("overview"),
      crm.stats<MesPunto[]>("ventas-mensuales"),
      crm.stats<EstadoPunto[]>("clientes-por-estado"),
      crm.stats<EstadoPunto[]>("tickets-por-estado"),
      crm.stats<CotMesPunto[]>("cotizaciones-mensuales"),
    ])
      .then(([o, s, ce, te, cs]) => {
        setOv(o);
        setSerie(s);
        setClientesEstado(ce);
        setTicketsEstado(te);
        setCotSerie(cs);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "No se pudieron cargar las métricas"),
      );
  }, []);

  if (error) {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-sm text-gray-500">
          Métricas clave, tendencia de ventas y distribución.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Ingresos del mes"
          value={money(ov?.ingresosMes)}
          icon={ov && ov.variacionMensualPct >= 0 ? TrendingUp : TrendingDown}
          hint={
            ov
              ? `${ov.variacionMensualPct >= 0 ? "+" : ""}${ov.variacionMensualPct}% vs mes anterior`
              : undefined
          }
          tone={ov && ov.variacionMensualPct >= 0 ? "green" : "red"}
        />
        <Kpi
          label="Clientes activos"
          value={ov ? `${ov.clientesActivos} / ${ov.clientes}` : "—"}
          icon={Users}
        />
        <Kpi
          label="Solicitudes web nuevas"
          value={ov?.solicitudesNuevas ?? "—"}
          icon={Inbox}
          tone={ov && ov.solicitudesNuevas > 0 ? "yellow" : "gray"}
          hint={
            ov && ov.solicitudesNuevas > 0 ? "pendientes de revisar" : undefined
          }
        />
        <Kpi
          label="Tickets abiertos"
          value={ov?.ticketsAbiertos ?? "—"}
          icon={Headset}
        />
        <Kpi
          label="Envíos en curso"
          value={ov?.enviosEnCurso ?? "—"}
          icon={Truck}
        />
        <Kpi
          label="Ingresos totales (12m)"
          value={money(ov?.ingresosTotales)}
          icon={TrendingUp}
        />
        <Kpi
          label="Productos"
          value={ov?.productos ?? "—"}
          icon={Package}
          hint={ov ? `${ov.productosBajoStock} bajo mínimo` : undefined}
          tone={ov && ov.productosBajoStock > 0 ? "yellow" : "gray"}
        />
        <Kpi
          label="Proveedores"
          value={ov?.proveedores ?? "—"}
          icon={Package}
        />
        <Kpi
          label="Documentos"
          value={ov?.documentos ?? "—"}
          icon={FileText}
        />
      </div>

      {/* KPIs comerciales de la agencia */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-gray-700">
        Comercial &amp; producción
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Cotizaciones del mes"
          value={
            ov
              ? `${ov.cotizacionesAprobadasMes} / ${ov.cotizacionesMes}`
              : "—"
          }
          icon={FileText}
          hint={ov ? "aprobadas / emitidas" : undefined}
        />
        <Kpi
          label="Tasa de conversión"
          value={ov ? `${ov.tasaConversionPct}%` : "—"}
          icon={Percent}
          tone={
            ov ? (ov.tasaConversionPct >= 40 ? "green" : "yellow") : "gray"
          }
        />
        <Kpi
          label="Valor del pipeline"
          value={money(ov?.valorPipeline)}
          icon={Coins}
          hint="cotizaciones enviadas sin cerrar"
        />
        <Kpi
          label="Por cobrar"
          value={money(ov?.porCobrar)}
          icon={Coins}
          tone={ov && ov.porCobrar > 0 ? "yellow" : "gray"}
        />
        <Kpi
          label="Pedidos en producción"
          value={ov?.pedidosEnProduccion ?? "—"}
          icon={Factory}
        />
        <Kpi
          label="Pedidos atrasados"
          value={ov?.pedidosAtrasados ?? "—"}
          icon={AlertTriangle}
          tone={ov && ov.pedidosAtrasados > 0 ? "red" : "green"}
          hint={
            ov
              ? ov.pedidosAtrasados > 0
                ? "requieren atención"
                : "todo a tiempo"
              : undefined
          }
        />
      </div>

      {/* Tendencia de ventas */}
      <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          Ventas por mes (últimos 12 meses)
        </h2>
        <BarChart data={serie} />
      </section>

      {/* Cotizaciones emitidas vs aprobadas */}
      <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          Cotizaciones por mes (emitidas vs aprobadas)
        </h2>
        <CotChart data={cotSerie} />
      </section>

      {/* Distribuciones */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Distribucion titulo="Clientes por estado" data={clientesEstado} />
        <Distribucion titulo="Tickets por estado" data={ticketsEstado} />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  hint,
  tone = "gray",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: "green" | "red" | "yellow" | "gray";
}) {
  const toneCls = {
    green: "text-emerald-600",
    red: "text-red-500",
    yellow: "text-amber-600",
    gray: "text-gray-400",
  }[tone];
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <Icon className="h-5 w-5 text-orange-400" />
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className={`mt-1 text-xs font-medium ${toneCls}`}>{hint}</p>}
    </div>
  );
}

function BarChart({ data }: { data: MesPunto[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">Sin datos.</p>;
  }
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.periodo} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-orange-400/80 transition-all hover:bg-orange-500"
            style={{ height: `${(d.total / max) * 140 + 4}px` }}
            title={`${d.periodo}: ${money(d.total)} (${d.cantidad} ventas)`}
          />
          <span className="text-[10px] text-gray-400">
            {d.periodo.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CotChart({ data }: { data: CotMesPunto[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">Sin datos.</p>;
  }
  const max = Math.max(...data.map((d) => d.enviadas), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.periodo} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="relative w-full rounded-t bg-gray-200"
            style={{ height: `${(d.enviadas / max) * 140 + 4}px` }}
            title={`${d.periodo}: ${d.aprobadas}/${d.enviadas} aprobadas · ${money(d.montoAprobado)}`}
          >
            <div
              className="absolute inset-x-0 bottom-0 rounded-t bg-orange-400"
              style={{
                height: `${d.enviadas ? (d.aprobadas / d.enviadas) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{d.periodo.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

function Distribucion({
  titulo,
  data,
}: {
  titulo: string;
  data: EstadoPunto[];
}) {
  const total = data.reduce((a, b) => a + b.cantidad, 0) || 1;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">{titulo}</h2>
      <div className="space-y-3">
        {data.length === 0 && (
          <p className="text-sm text-gray-400">Sin datos.</p>
        )}
        {data.map((d) => (
          <div key={d.estado}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>{badge(d.estado, estadoTone(d.estado))}</span>
              <span className="text-gray-500">
                {d.cantidad} ({Math.round((d.cantidad / total) * 100)}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-orange-400"
                style={{ width: `${(d.cantidad / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
