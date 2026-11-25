import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsync } from '../hooks/useProducts.js';
import { auditService, EVENT_TYPES, EVENT_TRANSLATIONS, formatEventType } from '../services/auditService.js';
import { formatDateTime } from '../utils/format.js';
import { LABELS } from './MyOrders.jsx';
import { Card, State } from '../components/Charts.jsx';

const field = 'w-full rounded-lg border border-oliva-claro/40 bg-crema px-2 py-1.5 text-sm text-cafe dark:bg-cafe/40 dark:text-crema';
const EMPTY = { usuario: '', eventType: '', from: '', to: '' };

const formatStatus = (s) => (s ? LABELS[s] || s : '—');

function Timeline({ orderId, onClose }) {
  const t = useAsync(() => auditService.timeline(orderId), [orderId]);
  return (
    <Card title={`Línea de tiempo · Pedido #${orderId}`} action={<button onClick={onClose} className="text-sm underline">Cerrar</button>}>
      <State loading={t.loading} error={t.error} empty={t.data?.length === 0}>
        <ol className="relative ml-2 space-y-5 border-l-2 border-oliva-claro/30 pl-5">
          {t.data?.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[1.78rem] top-1 h-3 w-3 rounded-full bg-ocre ring-4 ring-white dark:bg-lima dark:ring-oliva" />
              <p className="text-sm font-bold text-cafe dark:text-crema">{formatEventType(e.type)}</p>
              {(e.from || e.to) && (
                <p className="text-xs font-medium opacity-85">
                  {formatStatus(e.from)} → {formatStatus(e.to)}
                </p>
              )}
              {e.summary && <p className="text-xs opacity-80">{e.summary}</p>}
              <p className="text-xs opacity-60">{e.actor} · {formatDateTime(e.at)}</p>
            </li>
          ))}
        </ol>
      </State>
    </Card>
  );
}

export default function Audit() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(EMPTY);
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [orderInput, setOrderInput] = useState(params.get('order') ?? '');
  const order = params.get('order');
  const events = useAsync(() => auditService.events({ ...filters, page }), [filters, page]);
  const d = events.data;

  useEffect(() => { setOrderInput(order ?? ''); }, [order]);
  const set = (k) => (e) => setDraft((x) => ({ ...x, [k]: e.target.value }));
  const apply = (e) => { e.preventDefault(); setPage(0); setFilters(draft); };
  const reset = () => { setDraft(EMPTY); setFilters(EMPTY); setPage(0); };
  const openOrder = (id) => setParams(id ? { order: String(id) } : {});
  const badRange = draft.from && draft.to && draft.from > draft.to;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card title="Filtros">
          <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-medium">Usuario
              <input value={draft.usuario} onChange={set('usuario')} placeholder="Nombre o correo" className={field} />
            </label>
            <label className="text-xs font-medium">Tipo de evento
              <select value={draft.eventType} onChange={set('eventType')} className={field}>
                <option value="">Todos los eventos</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TRANSLATIONS[t] || t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium">Desde
              <input type="date" value={draft.from} onChange={set('from')} className={field} />
            </label>
            <label className="text-xs font-medium">Hasta
              <input type="date" value={draft.to} onChange={set('to')} className={field} />
            </label>
            <div className="flex items-center gap-3 sm:col-span-2 xl:col-span-4">
              <button type="submit" disabled={badRange} className="rounded-lg bg-ocre px-4 py-2 text-sm font-bold text-cafe disabled:opacity-40">Filtrar</button>
              <button type="button" onClick={reset} className="text-sm underline">Limpiar filtros</button>
              {badRange && <span className="text-xs text-terracota dark:text-lima">La fecha inicial debe ser anterior a la final.</span>}
            </div>
          </form>
        </Card>

        <Card title="Registro de Eventos" action={d && <span className="text-xs">{d.total} registro(s)</span>}>
          <State loading={events.loading} error={events.error} empty={d?.items.length === 0}>
            {d && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-cafe dark:text-crema">
                    <thead>
                      <tr className="text-xs opacity-70">
                        <th className="py-2 pr-3">Fecha y hora</th>
                        <th className="pr-3">Evento</th>
                        <th className="pr-3">Usuario</th>
                        <th className="pr-3">Entidad</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {d.items.map((e) => {
                        const isOrder = /^order/i.test(e.entityType);
                        return (
                          <tr key={e.id} className="border-t border-oliva-claro/20">
                            <td className="whitespace-nowrap py-3 pr-3 text-xs">{formatDateTime(e.at)}</td>
                            <td className="pr-3">
                              <span className="inline-flex items-center gap-1.5 font-medium text-cafe dark:text-crema">
                                <span className="h-2 w-2 rounded-full bg-ocre dark:bg-lima" />
                                {formatEventType(e.type)}
                              </span>
                            </td>
                            <td className="pr-3 font-medium">{e.actor}</td>
                            <td className="pr-3 text-xs opacity-85">
                              {isOrder ? `Pedido #${e.entityId}` : `${e.entityType} ${e.entityId}`}
                            </td>
                            <td className="text-right">
                              {isOrder && (
                                <button
                                  onClick={() => openOrder(e.entityId)}
                                  className="text-xs font-semibold text-ocre underline hover:text-cafe dark:text-lima dark:hover:text-crema"
                                >
                                  Ver seguimiento
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg bg-oliva-claro/15 px-3 py-1.5 disabled:opacity-40">← Anterior</button>
                  <span>Página {page + 1} de {Math.max(d.totalPages, 1)}</span>
                  <button disabled={page + 1 >= d.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg bg-oliva-claro/15 px-3 py-1.5 disabled:opacity-40">Siguiente →</button>
                </div>
              </>
            )}
          </State>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Buscar pedido">
          <form onSubmit={(e) => { e.preventDefault(); if (/^\d+$/.test(orderInput.trim())) openOrder(orderInput.trim()); }} className="flex gap-2">
            <input value={orderInput} onChange={(e) => setOrderInput(e.target.value)} inputMode="numeric" placeholder="Número de pedido" aria-label="ID del pedido" className={field} />
            <button type="submit" className="rounded-lg bg-ocre px-3 text-sm font-bold text-cafe">Ver</button>
          </form>
        </Card>
        {order && <Timeline key={order} orderId={order} onClose={() => openOrder(null)} />}
      </div>
    </div>
  );
}
