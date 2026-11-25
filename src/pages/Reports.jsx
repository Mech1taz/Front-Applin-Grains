import { useState } from 'react';
import { useAsync } from '../hooks/useProducts.js';
import { reportService } from '../services/reportService.js';
import { formatMinutes, formatPrice } from '../utils/format.js';
import { Card, HBars, SalesChart, State } from '../components/Charts.jsx';
import Icon from '../components/Icon.jsx';

const field = 'rounded-lg border border-oliva-claro/40 bg-crema px-2 py-1 text-sm text-cafe dark:bg-cafe/40 dark:text-crema';

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNDaysAgoStr = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Kpi = ({ label, value, hint }) => (
  <Card>
    <p className="text-sm">{label}</p>
    <p className="mt-1 font-display text-3xl font-bold text-cafe dark:text-lima">{value}</p>
    {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
  </Card>
);

export default function Reports() {
  const today = getTodayStr();
  // Por defecto, muestra desde 7 días atrás hasta hoy para que dibuje la curva completa de evolución
  const [range, setRange] = useState({ from: getNDaysAgoStr(7), to: today });
  const [limit, setLimit] = useState(5);
  const summary = useAsync(() => reportService.summary(), []);
  const sales = useAsync(() => reportService.salesChart(range), [range.from, range.to]);
  const lead = useAsync(() => reportService.leadTimeChart(), []);
  const top = useAsync(() => reportService.topProducts(limit), [limit]);
  const s = summary.data;
  const reloadAll = () => { summary.reload(); sales.reload(); lead.reload(); top.reload(); };
  const badRange = range.from && range.to && range.from > range.to;

  const isTodayOnly = range.from === today && range.to === today;
  const is7Days = range.from === getNDaysAgoStr(7) && range.to === today;
  const is30Days = range.from === getNDaysAgoStr(30) && range.to === today;
  const isAll = !range.from && !range.to;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="relative overflow-hidden rounded-3xl bg-cafe p-7 text-crema shadow-sm dark:bg-terracota-muted lg:col-span-2">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-lima/15" aria-hidden="true" />
        <h2 className="font-display text-3xl font-bold text-lima">Reportes y KPIs</h2>
        <p className="mt-2 max-w-md text-sm opacity-80">Ventas, tiempos de ciclo y productos estrella, calculados en tiempo real desde los eventos de Kafka.</p>
        <button onClick={reloadAll} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-cafe">
          <Icon name="refresh" size={16} />Actualizar todo
        </button>
      </section>

      <section className="rounded-3xl bg-lima p-6 text-cafe shadow-sm">
        <h2 className="font-display text-xl font-bold">Resumen</h2>
        <State loading={summary.loading} error={summary.error}>
          {s && (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div><dt className="text-xs">Pedidos</dt><dd className="font-display text-2xl font-bold">{s.orders}</dd></div>
              <div><dt className="text-xs">Ventas</dt><dd className="font-display text-2xl font-bold">{formatPrice(s.sales)}</dd></div>
            </dl>
          )}
        </State>
      </section>

      <Card className="lg:col-span-2" title="Ventas por día"
        action={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label>Desde <input type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className={field} /></label>
            <label>Hasta <input type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className={field} /></label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRange({ from: today, to: today })}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  isTodayOnly
                    ? 'bg-ocre text-cafe dark:bg-lima dark:text-cafe'
                    : 'bg-oliva-claro/20 text-cafe hover:bg-oliva-claro/35 dark:text-crema'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setRange({ from: getNDaysAgoStr(7), to: today })}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  is7Days
                    ? 'bg-ocre text-cafe dark:bg-lima dark:text-cafe'
                    : 'bg-oliva-claro/20 text-cafe hover:bg-oliva-claro/35 dark:text-crema'
                }`}
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => setRange({ from: getNDaysAgoStr(30), to: today })}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  is30Days
                    ? 'bg-ocre text-cafe dark:bg-lima dark:text-cafe'
                    : 'bg-oliva-claro/20 text-cafe hover:bg-oliva-claro/35 dark:text-crema'
                }`}
              >
                30 días
              </button>
              <button
                type="button"
                onClick={() => setRange({ from: '', to: '' })}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  isAll
                    ? 'bg-ocre text-cafe dark:bg-lima dark:text-cafe'
                    : 'bg-oliva-claro/20 text-cafe hover:bg-oliva-claro/35 dark:text-crema'
                }`}
              >
                Todo
              </button>
            </div>
          </div>
        }>
        {badRange ? <p className="text-sm text-terracota dark:text-lima">La fecha inicial debe ser anterior a la final.</p> : (
          <State loading={sales.loading} error={sales.error} empty={sales.data?.length === 0}>{sales.data && <SalesChart data={sales.data} />}</State>
        )}
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <Kpi label="Ticket promedio" value={s ? formatPrice(s.ticket) : '—'} hint="Venta total ÷ pedidos" />
        <Kpi label="Lead time total" value={s ? formatMinutes(s.leadTotal) : '—'} hint="Desde creación hasta entrega" />
      </div>

      <Card title="Tiempo por fase">
        <State loading={lead.loading} error={lead.error}>
          {lead.data && <HBars items={lead.data.phases.map((p) => ({ label: p.label, value: p.min, display: formatMinutes(p.min) }))} />}
        </State>
      </Card>

      <Card className="lg:col-span-2" title="Productos más vendidos"
        action={
          <label className="text-xs">Mostrar{' '}
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className={field}>
              {[3, 5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        }>
        <State loading={top.loading} error={top.error} empty={top.data?.length === 0}>
          {top.data && <HBars items={top.data.map((p) => ({ label: p.name, value: p.units, display: `${p.units} u. · ${formatPrice(p.revenue)}` }))} />}
        </State>
      </Card>
    </div>
  );
}
