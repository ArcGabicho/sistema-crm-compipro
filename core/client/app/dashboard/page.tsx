"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FileText, Package, Factory, Truck } from "lucide-react";
import { crm } from "@/app/lib/crm";
import { money } from "@/app/components/dashboard/cells";

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

const card =
  "rounded-[1.75rem] bg-panel p-4 shadow-sm ring-1 ring-white";

const compactNf = new Intl.NumberFormat("es-PE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const monthLabel = (periodo: string) => {
  const d = new Date(`${periodo}-01T00:00:00`);
  return Number.isNaN(d.getTime())
    ? periodo.slice(5)
    : d.toLocaleDateString("es-PE", { month: "short" }).replace(".", "");
};

export default function EstadisticasPage() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [serie, setSerie] = useState<MesPunto[]>([]);
  const [cotSerie, setCotSerie] = useState<CotMesPunto[]>([]);
  const [clientesEstado, setClientesEstado] = useState<EstadoPunto[]>([]);
  const [ticketsEstado, setTicketsEstado] = useState<EstadoPunto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"ventas" | "cotizaciones">("ventas");

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
      <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</p>
    );
  }

  const ratio = (a: number, b: number) => (b > 0 ? Math.min(a / b, 1) : 0);

  const ventasBars: Bar[] = serie.map((d) => ({
    key: d.periodo,
    label: monthLabel(d.periodo),
    value: d.total,
    bubble: `S/ ${compactNf.format(d.total)}`,
    title: `${d.periodo}: ${money(d.total)} (${d.cantidad} ventas)`,
  }));
  const cotBars: Bar[] = cotSerie.map((d) => ({
    key: d.periodo,
    label: monthLabel(d.periodo),
    value: d.enviadas,
    fill: d.enviadas ? d.aprobadas / d.enviadas : 0,
    bubble: `${d.aprobadas}/${d.enviadas}`,
    title: `${d.periodo}: ${d.aprobadas}/${d.enviadas} aprobadas · ${money(d.montoAprobado)}`,
  }));

  return (
    <div className="flex flex-col xl:h-full xl:min-h-[38rem]">
      <header className="mb-3 flex flex-wrap items-baseline gap-x-4 px-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Estadísticas
        </h1>
        <p className="text-sm text-neutral-500">
          Métricas clave, tendencia de ventas y distribución.
        </p>
      </header>

      <div className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Columna izquierda: métricas en píldora + KPIs */}
        <div className="flex flex-col gap-3 xl:min-h-0">
          <div className="flex flex-col gap-2.5 xl:min-h-0 xl:flex-[5] xl:gap-1">
            <MetricRow
              label="Ingresos"
              caption="del mes"
              value={money(ov?.ingresosMes)}
              sub={ov ? `12m: ${money(ov.ingresosTotales)}` : undefined}
              progress={ov ? ratio(ov.ingresosMes, Math.max(ov.ingresosMes, ov.ingresosMesAnterior)) : 0}
              chip={
                ov
                  ? `${ov.variacionMensualPct >= 0 ? "+" : ""}${ov.variacionMensualPct}%`
                  : "—"
              }
              chipTone={ov && ov.variacionMensualPct < 0 ? "ink" : "accent"}
            />
            <MetricRow
              label="Cotizaciones"
              caption="aprobadas / emitidas"
              value={ov ? `${ov.cotizacionesAprobadasMes}/${ov.cotizacionesMes}` : "—"}
              progress={ov ? ratio(ov.cotizacionesAprobadasMes, ov.cotizacionesMes) : 0}
              chip={ov ? `${ov.tasaConversionPct}%` : "—"}
              chipTone="ink"
            />
            <MetricRow
              label="Pedidos"
              caption="en producción"
              value={ov?.pedidosEnProduccion ?? "—"}
              sub={ov ? (ov.pedidosAtrasados > 0 ? "requieren atención" : "todo a tiempo") : undefined}
              progress={ov ? ratio(ov.pedidosAtrasados, ov.pedidosEnProduccion) : 0}
              chip={ov ? `${ov.pedidosAtrasados} atrasados` : "—"}
              chipTone={ov && ov.pedidosAtrasados > 0 ? "ink" : "gray"}
            />
            <MetricRow
              label="Solicitudes web"
              caption="nuevas"
              value={ov?.solicitudesNuevas ?? "—"}
              sub={ov && ov.solicitudesNuevas > 0 ? "pendientes de revisar" : undefined}
              chip={ov ? (ov.solicitudesNuevas > 0 ? "Revisar" : "Al día") : "—"}
              chipTone={ov && ov.solicitudesNuevas > 0 ? "accent" : "gray"}
            />
            <MetricRow
              label="Tickets"
              caption="abiertos"
              value={ov?.ticketsAbiertos ?? "—"}
              chip={ov ? `${ov.enviosEnCurso} envíos` : "—"}
              chipTone="gray"
            />
          </div>

          <div className="grid auto-rows-fr grid-cols-2 gap-3 xl:min-h-0 xl:flex-[2]">
            <MiniKpi
              icon={<Package className="size-5" />}
              label="Productos"
              value={ov?.productos ?? "—"}
              hint={ov ? `${ov.productosBajoStock} bajo mínimo` : undefined}
              alert={!!ov && ov.productosBajoStock > 0}
            />
            <MiniKpi
              icon={<Truck className="size-5" />}
              label="Envíos en curso"
              value={ov?.enviosEnCurso ?? "—"}
            />
            <MiniKpi
              icon={<Factory className="size-5" />}
              label="Proveedores"
              value={ov?.proveedores ?? "—"}
            />
            <MiniKpi
              icon={<FileText className="size-5" />}
              label="Documentos"
              value={ov?.documentos ?? "—"}
            />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-3 xl:min-h-0">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:flex-none">
            <section className={`${card} flex min-w-0 flex-col`}>
              <h2 className="text-sm font-medium text-neutral-500">
                Clientes{" "}
                <span className="text-xs text-neutral-400">por estado</span>
              </h2>
              <div className="my-auto flex items-center gap-4 pt-2">
                <Donut
                  data={clientesEstado}
                  center={ov ? `${ov.clientesActivos}/${ov.clientes}` : "—"}
                  caption="activos"
                />
                <Legend data={clientesEstado} />
              </div>
            </section>

            <div className="grid min-w-0 gap-3">
              <section className="flex items-center justify-between gap-3 rounded-[1.75rem] bg-accent p-4 text-white shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/85">
                    Tasa de conversión
                  </p>
                  <p className="text-3xl font-semibold leading-tight tracking-tight">
                    {ov ? `${ov.tasaConversionPct}%` : "—"}
                  </p>
                </div>
                <div className="flex h-12 w-24 shrink-0 items-end gap-1.5">
                  {cotSerie.slice(-5).map((d) => {
                    const r = d.enviadas ? d.aprobadas / d.enviadas : 0;
                    return (
                      <div
                        key={d.periodo}
                        title={`${d.periodo}: ${Math.round(r * 100)}%`}
                        className="w-full rounded-full bg-white/90"
                        style={{ height: `${Math.max(r * 100, 12)}%` }}
                      />
                    );
                  })}
                </div>
              </section>

              <section className={card}>
                <h2 className="mb-2 text-sm font-medium text-neutral-500">
                  Cobranza
                </h2>
                <div className="space-y-1.5">
                  <MiniPill
                    label="Pipeline"
                    value={money(ov?.valorPipeline)}
                    progress={ov ? ratio(ov.valorPipeline, Math.max(ov.valorPipeline, ov.porCobrar)) : 0}
                  />
                  <MiniPill
                    label="Por cobrar"
                    value={money(ov?.porCobrar)}
                    progress={ov ? ratio(ov.porCobrar, Math.max(ov.valorPipeline, ov.porCobrar)) : 0}
                  />
                </div>
              </section>
            </div>
          </div>

          <section className={`${card} flex min-w-0 flex-col xl:min-h-[15rem] xl:flex-1`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-neutral-400">
                  {tab === "ventas" ? "Últimos 12 meses" : "Emitidas vs aprobadas"}
                </p>
                <h2 className="text-xl font-light text-ink sm:text-2xl">
                  {tab === "ventas" ? "Ventas por mes" : "Cotizaciones por mes"}
                </h2>
              </div>
              <div className="flex rounded-full bg-frame p-1 text-sm">
                {(["ventas", "cotizaciones"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-full px-4 py-1 capitalize transition-all ${
                      tab === t
                        ? "bg-white font-medium text-ink shadow-sm"
                        : "text-neutral-500 hover:text-ink"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 xl:min-h-0 xl:flex-1">
              <PillChart bars={tab === "ventas" ? ventasBars : cotBars} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
              {tab === "ventas" ? (
                <>
                  <LegendDot swatch="hatch-accent" label="Mejor mes" />
                  <LegendDot swatch="bg-ink" label="Sobre el promedio" />
                  <LegendDot swatch="bg-neutral-300" label="Bajo el promedio" />
                </>
              ) : (
                <>
                  <LegendDot swatch="bg-neutral-300" label="Emitidas" />
                  <LegendDot swatch="hatch-accent" label="Aprobadas" />
                </>
              )}
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-2 text-sm font-medium text-neutral-500">
              Tickets <span className="text-xs text-neutral-400">por estado</span>
            </h2>
            <Distribucion data={ticketsEstado} />
          </section>
        </div>
      </div>
    </div>
  );
}

type Tone = "accent" | "ink" | "gray";

const CHIP: Record<Tone, string> = {
  accent: "bg-accent text-white",
  ink: "bg-ink text-white",
  gray: "bg-neutral-300 text-neutral-700",
};

function MetricRow({
  label,
  caption,
  value,
  sub,
  progress,
  chip,
  chipTone,
}: {
  label: string;
  caption: string;
  value: string | number;
  sub?: string;
  progress?: number;
  chip: string;
  chipTone: Tone;
}) {
  return (
    <div className="flex flex-col xl:min-h-0 xl:flex-1 xl:justify-center">
      <h3 className="mb-1 px-3 text-sm font-medium text-neutral-400 xl:text-base xl:font-light">
        {label} <span className="text-xs font-normal">{caption}</span>
      </h3>
      <div className="flex items-stretch gap-2 rounded-full bg-panel p-1.5 shadow-sm ring-1 ring-white xl:max-h-[4.5rem] xl:min-h-[2.75rem] xl:flex-1">
        <div className="flex min-w-0 flex-1 items-center gap-4 pl-4">
          <div className="flex min-w-0 shrink-0 flex-col justify-center xl:flex-row xl:items-baseline xl:gap-2">
            <p className="truncate text-xl font-semibold leading-tight text-ink">
              {value}
            </p>
            {sub && (
              <p className="truncate text-[11px] text-neutral-500">{sub}</p>
            )}
          </div>
          {progress !== undefined && (
            <div className="hidden h-7 min-w-0 flex-1 self-center sm:block">
              <div
                className="hatch-accent h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.max(progress * 100, 8)}%` }}
              />
            </div>
          )}
        </div>
        <div
          className={`flex shrink-0 items-center rounded-full px-4 text-sm font-semibold ${CHIP[chipTone]}`}
        >
          {chip}
        </div>
      </div>
    </div>
  );
}

function MiniPill({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-full bg-frame">
      <div
        className="hatch-accent absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${Math.max(progress * 100, 10)}%` }}
      />
      <div className="relative flex items-center justify-between px-3 py-1.5 text-xs sm:text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold text-ink">{value}</span>
      </div>
    </div>
  );
}

function MiniKpi({
  icon,
  label,
  value,
  hint,
  alert,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  alert?: boolean;
}) {
  return (
    <div className={`${card} flex items-center gap-3 !p-3`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-neutral-500">{label}</p>
        <p className="text-xl font-semibold leading-tight text-ink">{value}</p>
        {hint && (
          <p
            className={`truncate text-[11px] font-medium ${
              alert ? "text-accent" : "text-neutral-400"
            }`}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

const DONUT_COLORS = ["url(#donut-hatch)", "#151515", "#4a4a4a", "#9b9b9b", "#cfcfcf"];
const SWATCH = ["hatch-accent", "bg-ink", "bg-neutral-600", "bg-neutral-400", "bg-neutral-300"];

function Donut({
  data,
  center,
  caption,
}: {
  data: EstadoPunto[];
  center: string;
  caption: string;
}) {
  const total = data.reduce((a, b) => a + b.cantidad, 0);
  const R = 40;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative size-32 shrink-0 xl:size-28">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <defs>
          <pattern
            id="donut-hatch"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="5" height="5" fill="#fff0d9" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="#ffa62b" strokeWidth="1.6" />
          </pattern>
        </defs>
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e1e5e6" strokeWidth="14" />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.cantidad / total) * C;
            const seg = (
              <circle
                key={d.estado}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth="14"
                strokeDasharray={`${Math.max(len - 1.5, 0)} ${C - Math.max(len - 1.5, 0)}`}
                strokeDashoffset={-offset}
              >
                <title>{`${d.estado}: ${d.cantidad}`}</title>
              </circle>
            );
            offset += len;
            return seg;
          })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-lg font-semibold leading-tight text-ink">{center}</p>
          <p className="text-[10px] text-neutral-400">{caption}</p>
        </div>
      </div>
    </div>
  );
}

function Legend({ data }: { data: EstadoPunto[] }) {
  if (data.length === 0)
    return <p className="text-sm text-neutral-400">Sin datos.</p>;
  return (
    <ul className="min-w-0 flex-1 space-y-1.5">
      {data.map((d, i) => (
        <li
          key={d.estado}
          className="flex items-center justify-between gap-2 rounded-full bg-frame px-3 py-1 text-xs"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={`size-2.5 shrink-0 rounded-full ${SWATCH[i % SWATCH.length]}`}
            />
            <span className="truncate text-neutral-600">{d.estado}</span>
          </span>
          <span className="font-semibold text-ink">{d.cantidad}</span>
        </li>
      ))}
    </ul>
  );
}

function LegendDot({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-3 w-6 rounded-full ${swatch}`} />
      {label}
    </span>
  );
}

type Bar = {
  key: string;
  label: string;
  value: number;
  fill?: number;
  bubble: string;
  title: string;
};

function PillChart({ bars }: { bars: Bar[] }) {
  if (bars.length === 0) {
    return <p className="text-sm text-neutral-400">Sin datos.</p>;
  }
  const n = bars.length;
  const max = Math.max(...bars.map((b) => b.value), 1);
  const avg = bars.reduce((a, b) => a + b.value, 0) / n;
  const peak = bars.findIndex((b) => b.value === max);
  const height = (v: number) => 10 + (v / max) * 72;
  const pts = bars.map((b, i) => ({
    x: ((i + 0.5) / n) * 100,
    y: 100 - height(b.value),
  }));
  const path = pts
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const q = pts[i - 1];
      const mx = (q.x + p.x) / 2;
      return `C ${mx} ${q.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(" ");
  const stacked = bars.some((b) => b.fill !== undefined);

  return (
    <div className="flex h-56 flex-col sm:h-64 xl:h-full xl:min-h-[9rem]">
      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-3">
          {bars.map((b, i) => {
            const cls = stacked
              ? "bg-neutral-300"
              : i === peak
                ? "hatch-accent"
                : b.value >= avg
                  ? "bg-ink"
                  : "bg-neutral-300";
            return (
              <div
                key={b.key}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              >
                <div
                  title={b.title}
                  className={`relative mx-auto w-full max-w-12 rounded-full transition-all duration-500 ${cls}`}
                  style={{ height: `${height(b.value)}%` }}
                >
                  {b.fill !== undefined && (
                    <div
                      className="hatch-accent absolute inset-x-0 bottom-0 rounded-full"
                      style={{ height: `${Math.max(b.fill * 100, b.fill > 0 ? 12 : 0)}%` }}
                    />
                  )}
                  {i === peak && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink shadow ring-1 ring-accent/60">
                      {b.bubble}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <path
            d={path}
            fill="none"
            stroke="#151515"
            strokeOpacity="0.5"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {pts.map((p, i) => (
          <span
            key={bars[i].key}
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-ink/70"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-1.5 sm:gap-3">
        {bars.map((b) => (
          <span
            key={b.key}
            className="min-w-0 flex-1 truncate text-center text-[11px] capitalize text-neutral-400"
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Distribucion({ data }: { data: EstadoPunto[] }) {
  const total = data.reduce((a, b) => a + b.cantidad, 0) || 1;
  if (data.length === 0)
    return <p className="text-sm text-neutral-400">Sin datos.</p>;
  const max = Math.max(...data.map((d) => d.cantidad));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]">
      {data.map((d) => (
        <div
          key={d.estado}
          className="relative overflow-hidden rounded-full bg-frame"
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${
              d.cantidad === max ? "hatch-accent" : "bg-neutral-300"
            }`}
            style={{ width: `${Math.max((d.cantidad / total) * 100, 6)}%` }}
          />
          <div className="relative flex items-center justify-between gap-1 px-3 py-1.5 text-xs">
            <span className="truncate text-neutral-700">{d.estado}</span>
            <span className="shrink-0 font-semibold text-ink">
              {d.cantidad}{" "}
              <span className="text-[10px] font-normal text-neutral-500">
                ({Math.round((d.cantidad / total) * 100)}%)
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
