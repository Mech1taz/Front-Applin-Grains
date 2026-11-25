import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useProducts.js';
import { orderService } from '../services/orderService.js';
import { formatPrice } from '../utils/format.js';

export const FLOW = ['CREADO', 'ACEPTADO', 'CONFIRMADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'];

export const LABELS = {
  CREADO: 'Pedido recibido',
  ACEPTADO: 'Aceptado',
  CONFIRMADO: 'Confirmado',
  EN_PREPARACION: 'En preparación',
  DESPACHADO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const STATUS_COLORS = {
  CREADO: 'bg-oliva-claro/20 text-cafe dark:text-crema',
  ACEPTADO: 'bg-ocre/20 text-cafe dark:text-ocre',
  CONFIRMADO: 'bg-ocre/30 text-cafe dark:text-ocre',
  EN_PREPARACION: 'bg-ocre text-cafe dark:bg-ocre/80',
  DESPACHADO: 'bg-lima/40 text-cafe dark:text-lima',
  ENTREGADO: 'bg-lima text-cafe dark:bg-lima/90',
  CANCELADO: 'bg-terracota/20 text-terracota dark:text-lima',
};

export function OrderProgress({ status }) {
  if (status === 'CANCELADO') return null;
  const idx = FLOW.indexOf(status);
  const activeIdx = idx >= 0 ? idx : 0;
  const percent = Math.min(100, Math.max(16, ((activeIdx + 1) / FLOW.length) * 100));

  return (
    <div className="mt-3">
      <div className="h-2 overflow-hidden rounded-full bg-oliva-claro/20">
        <motion.div
          className="h-full bg-ocre dark:bg-lima"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium">
        <span>Recibido</span>
        <span>Preparando</span>
        <span>En camino</span>
        <span>Entregado</span>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => orderService.mine(user), [user?.email]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold text-cafe dark:text-crema">Mis pedidos</h1>
        <button
          onClick={reload}
          className="rounded-full bg-oliva-claro/15 px-4 py-1.5 text-xs font-semibold text-cafe transition hover:bg-oliva-claro/30 dark:text-crema"
        >
          ↻ Actualizar
        </button>
      </div>

      {loading && <div className="mt-6 h-32 animate-pulse rounded-2xl bg-oliva-claro/15" />}

      {error && (
        <div className="mt-6 rounded-2xl bg-terracota/10 p-5 text-terracota dark:text-lima">
          <p>{error.message}</p>
          <button onClick={reload} className="mt-2 text-sm underline">Reintentar</button>
        </div>
      )}

      {!loading && data?.length === 0 && (
        <div className="mt-6 rounded-2xl bg-oliva-claro/10 p-8 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-2 text-lg font-medium text-cafe dark:text-crema">Aún no tienes pedidos.</p>
          <p className="text-sm opacity-70">Tus compras y su seguimiento aparecerán aquí.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-xl bg-ocre px-6 py-2.5 font-bold text-cafe transition hover:brightness-110 dark:bg-terracota-muted dark:text-crema"
          >
            Ir al catálogo
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {data?.map((o, i) => (
          <motion.li
            key={o.id || o.number || i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-white p-5 shadow-md dark:bg-oliva"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg font-bold text-cafe dark:text-crema">{o.number}</p>
                {o.createdAt && (
                  <p className="text-xs opacity-70">
                    {new Date(o.createdAt).toLocaleString('es-CL', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-cafe dark:text-lima">{formatPrice(o.total)}</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                    STATUS_COLORS[o.status] || 'bg-oliva-claro/20 text-cafe dark:text-crema'
                  }`}
                >
                  {LABELS[o.status] ?? o.status}
                </span>
              </div>
            </div>

            <OrderProgress status={o.status} />

            <ul className="mt-4 space-y-1 border-t border-oliva-claro/20 pt-3 text-sm">
              {o.items.map((it, idx) => (
                <li key={it.id || idx} className="flex justify-between">
                  <span>
                    <strong className="font-semibold text-cafe dark:text-crema">{it.quantity}×</strong> {it.name}
                  </span>
                  <span className="font-medium text-cafe dark:text-crema">{formatPrice(it.subtotal)}</span>
                </li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
