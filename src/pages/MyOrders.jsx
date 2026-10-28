import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAsync } from '../hooks/useProducts.js';
import { orderService } from '../services/orderService.js';
import { formatPrice } from '../utils/format.js';

const FLOW = ['CREADO', 'EN_PREPARACION', 'DESPACHADO'];
const LABELS = { CREADO: 'Pedido recibido', EN_PREPARACION: 'En preparación', DESPACHADO: 'En camino' };

function Progress({ status }) {
  const idx = FLOW.indexOf(status);
  if (idx < 0) return null;
  return (
    <div className="mt-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-oliva-claro/20">
        <motion.div className="h-full bg-ocre" initial={{ width: 0 }} animate={{ width: `${((idx + 1) / FLOW.length) * 100}%` }} transition={{ duration: 0.8 }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px]">
        {FLOW.map((s, i) => <span key={s} className={i <= idx ? 'font-bold text-cafe dark:text-crema' : 'opacity-60'}>{LABELS[s]}</span>)}
      </div>
    </div>
  );
}

export default function MyOrders() {
  const { data, loading, error, reload } = useAsync(() => orderService.mine(), []);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-cafe dark:text-crema">Mis pedidos</h1>

      {loading && <div className="mt-6 h-32 animate-pulse rounded-2xl bg-oliva-claro/15" />}
      {error && (
        <div className="mt-6 rounded-2xl bg-terracota/10 p-5 text-terracota dark:text-lima">
          <p>{error.message}</p>
          <button onClick={reload} className="mt-2 text-sm underline">Reintentar</button>
        </div>
      )}
      {data?.length === 0 && (
        <div className="mt-6 rounded-2xl bg-oliva-claro/10 p-6 text-center">
          <p>Aún no tienes pedidos.</p>
          <Link to="/" className="mt-3 inline-block underline">Ir al catálogo</Link>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {data?.map((o, i) => (
          <motion.li key={o.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl bg-white p-5 shadow-md dark:bg-oliva">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg font-bold text-cafe dark:text-crema">{o.number}</p>
                {o.createdAt && <p className="text-xs opacity-70">{new Date(o.createdAt).toLocaleString('es-CL')}</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-cafe dark:text-lima">{formatPrice(o.total)}</p>
                <span className="rounded-full bg-oliva-claro/20 px-3 py-1 text-xs font-bold text-cafe dark:text-crema">{LABELS[o.status] ?? o.status}</span>
              </div>
            </div>
            <Progress status={o.status} />
            <ul className="mt-3 border-t border-oliva-claro/20 pt-2 text-sm">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between"><span>{it.quantity} × {it.name}</span><span>{formatPrice(it.subtotal)}</span></li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
