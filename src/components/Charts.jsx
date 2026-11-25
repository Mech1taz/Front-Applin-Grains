import { useState } from 'react';
import { formatPrice } from '../utils/format.js';

/** Tarjeta base del panel (mismo radio y sombra en todo el dashboard). */
export const Card = ({ title, action, className = '', children }) => (
  <section className={`rounded-3xl bg-white p-5 shadow-sm dark:bg-oliva ${className}`}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-cafe dark:text-crema">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const State = ({ loading, error, empty, children }) => {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-oliva-claro/15" role="status" aria-label="Cargando" />;
  if (error) return <p className="text-sm font-medium text-terracota dark:text-lima">{error.message}</p>;
  if (empty) return <p className="rounded-2xl bg-oliva-claro/10 p-6 text-center text-sm">Sin datos para mostrar.</p>;
  return children;
};

/** Ventas por día: área + línea con soporte para día individual (barra destacada). */
export function SalesChart({ data = [] }) {
  const [hover, setHover] = useState(null);
  const W = 600, H = 220, pad = { l: 24, r: 24, t: 28, b: 28 };

  const validData = Array.isArray(data) ? data : [];
  const max = Math.max(...validData.map((d) => d.amount || 0), 1);
  const totalAmount = validData.reduce((acc, d) => acc + (d.amount || 0), 0);
  const totalOrders = validData.reduce((acc, d) => acc + (d.orders || 0), 0);

  const x = (i) =>
    pad.l +
    (validData.length <= 1
      ? (W - pad.l - pad.r) / 2
      : (i * (W - pad.l - pad.r)) / (validData.length - 1));

  const y = (v) => pad.t + (1 - (v || 0) / max) * (H - pad.t - pad.b);

  const line = validData.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.amount)}`).join(' ');
  const area = validData.length > 1
    ? `${line} L${x(validData.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`
    : '';

  // Día activo para mostrar datos: el seleccionado o el último por defecto
  const active =
    hover != null
      ? validData[hover]
      : (validData.length > 0 ? validData[validData.length - 1] : null);

  return (
    <div>
      {/* Resumen visible del monto y pedidos */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-oliva-claro/15 pb-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-oliva-claro dark:text-crema/70">
            {hover != null
              ? 'Detalle seleccionado'
              : (validData.length === 1 ? 'Ventas del día' : 'Último registro')}
          </span>
          <p className="font-display text-2xl font-bold text-cafe dark:text-lima">
            {active ? formatPrice(active.amount) : formatPrice(0)}
          </p>
        </div>
        {active && (
          <div className="text-right text-xs">
            <span className="font-semibold text-cafe dark:text-crema">
              {active.orders} {active.orders === 1 ? 'pedido' : 'pedidos'}
            </span>
            <span className="opacity-75"> · {active.date}</span>
            {validData.length > 1 && (
              <p className="mt-0.5 text-[11px] opacity-65">
                Total período: {formatPrice(totalAmount)} ({totalOrders} pedidos)
              </p>
            )}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Ventas por día"
        onMouseLeave={() => setHover(null)}
      >
        {/* Líneas guía horizontales */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={pad.l}
            x2={W - pad.r}
            y1={y(max * t)}
            y2={y(max * t)}
            className="stroke-oliva-claro/20"
            strokeDasharray="3 4"
          />
        ))}

        {/* Caso 1: Varios días (Dibuja área y línea continua) */}
        {validData.length > 1 && (
          <>
            <path d={area} className="fill-ocre/25 dark:fill-lima/15 transition-all duration-300" />
            <path
              d={line}
              fill="none"
              strokeWidth="2.5"
              strokeLinejoin="round"
              className="stroke-ocre dark:stroke-lima"
            />
          </>
        )}

        {/* Caso 2: Un solo día (Dibuja columna / barra destacada) */}
        {validData.length === 1 && (
          <g>
            <rect
              x={x(0) - 28}
              y={y(validData[0].amount)}
              width={56}
              height={Math.max(H - pad.b - y(validData[0].amount), 8)}
              rx={6}
              className="fill-ocre/40 dark:fill-lima/30 transition-all duration-300"
            />
            <line
              x1={x(0)}
              y1={pad.t}
              x2={x(0)}
              y2={H - pad.b}
              className="stroke-oliva-claro/30"
              strokeDasharray="2 3"
            />
            {/* Monto destacado sobre la barra */}
            <text
              x={x(0)}
              y={Math.max(y(validData[0].amount) - 10, pad.t + 10)}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              className="fill-cafe dark:fill-lima"
            >
              {formatPrice(validData[0].amount)}
            </text>
          </g>
        )}

        {/* Puntos / círculos interactivos */}
        {validData.map((d, i) => {
          const isSelected =
            hover != null ? hover === i : (validData.length === 1 || i === validData.length - 1);
          return (
            <g key={d.date}>
              <circle
                cx={x(i)}
                cy={y(d.amount)}
                r={isSelected ? 6 : 4}
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                className={`cursor-pointer transition-all duration-200 outline-none ${
                  isSelected
                    ? 'fill-ocre stroke-white stroke-2 dark:fill-lima dark:stroke-cafe'
                    : 'fill-white stroke-ocre stroke-2 dark:fill-oliva dark:stroke-lima'
                }`}
              />
            </g>
          );
        })}

        {/* Fechas en el eje X */}
        {validData.length === 1 ? (
          <text
            x={x(0)}
            y={H - 6}
            fontSize="11"
            textAnchor="middle"
            className="fill-current font-semibold opacity-75"
          >
            {validData[0].date}
          </text>
        ) : (
          [0, validData.length - 1].map(
            (i) =>
              validData[i] && (
                <text
                  key={i}
                  x={x(i)}
                  y={H - 6}
                  fontSize="11"
                  textAnchor={i === 0 ? 'start' : 'end'}
                  className="fill-current opacity-70"
                >
                  {validData[i].date}
                </text>
              )
          )
        )}
      </svg>
    </div>
  );
}

/** Barras horizontales genéricas: items = [{ label, value, display }] */
export function HBars({ items, tone = 'ocre' }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const fill = tone === 'lima' ? 'bg-lima' : 'bg-ocre dark:bg-lima';
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-cafe dark:text-crema">{i.label}</span>
            <span className="shrink-0 font-bold text-cafe dark:text-crema">{i.display}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-oliva-claro/20">
            <div className={`h-full rounded-full transition-all duration-700 ${fill}`} style={{ width: `${Math.max((i.value / max) * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
