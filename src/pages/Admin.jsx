import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAsync, useProducts } from '../hooks/useProducts.js';
import { orderService } from '../services/orderService.js';
import { catalogService } from '../services/catalogService.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/format.js';

// Estados de OrderStatus (ms-orders), en orden de flujo.
const KNOWN_STATUSES = ['CREADO', 'ACEPTADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'];
// Transiciones permitidas: mismo mapa que OrderStateMachineImpl. ENTREGADO y CANCELADO son terminales.
const NEXT_STATUSES = {
  CREADO: ['ACEPTADO', 'CANCELADO'],
  ACEPTADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['DESPACHADO', 'CANCELADO'],
  DESPACHADO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};
const input = 'rounded-lg border border-oliva-claro/40 bg-crema px-2 py-1 text-sm text-cafe dark:bg-cafe/40 dark:text-crema';
const danger = 'text-terracota dark:text-lima';

function OrderCard({ order, statuses }) {
  const { notify } = useToast();
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const allowed = NEXT_STATUSES[status] ?? [];
  const options = [status, ...allowed]; // solo el estado actual y los cambios permitidos

  const save = async (next) => {
    setSaving(true);
    try {
      await orderService.updateStatus(order.id, next);
      setStatus(next);
      notify(`${order.number}: estado actualizado a ${next}.`, 'success');
    } catch (err) {
      notify(err.message, 'error', 6000); // p. ej. 409 si la transición no está permitida; el select vuelve atrás
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm dark:bg-oliva">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-cafe dark:text-crema">{order.number}</p>
          <p className="text-sm">{order.customer} · {order.email}</p>
          {order.createdAt && <p className="text-xs opacity-70">{new Date(order.createdAt).toLocaleString('es-CL')}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-cafe dark:text-lima">{formatPrice(order.total)}</p>
          <select value={status} disabled={saving || allowed.length === 0} onChange={(e) => save(e.target.value)} aria-label={`Estado de ${order.number}`} className={`${input} mt-1 disabled:opacity-50`}>
            {options.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <ul className="mt-3 border-t border-oliva-claro/20 pt-2 text-sm">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between"><span>{i.quantity} × {i.name}</span><span>{formatPrice(i.subtotal)}</span></li>
        ))}
      </ul>
    </li>
  );
}

function ProductRow({ product, onChanged }) {
  const { notify } = useToast();
  const [d, setD] = useState({ price: String(product.price), stock: String(product.stock), imageUrl: product.image ?? '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }));

  const price = Number(d.price), stock = Number(d.stock);
  const dirty = price !== product.price || stock !== product.stock || d.imageUrl !== (product.image ?? '');
  const valid = d.price !== '' && d.stock !== '' && price >= 0 && Number.isInteger(stock) && stock >= 0;

  const run = async (action, okMsg) => {
    setBusy(true);
    try { await action(); notify(okMsg, 'success'); onChanged(); }
    catch (err) { notify(err.message, 'error', 6000); }
    finally { setBusy(false); }
  };

  const save = () => run(async () => {
    const updated = await catalogService.updateProduct(product.id, { price, stock, ...(d.imageUrl.trim() && { imageUrl: d.imageUrl.trim() }) });
    // Autocomprobación: si el servidor devolvió otros valores, el DTO de actualización usa otros nombres de campo
    if (updated.price !== price || updated.stock !== stock) throw new Error('El servidor no aplicó los cambios. Revisa los campos de ProductUpdateDto.');
  }, `"${product.name}" actualizado.`);

  const remove = () => {
    if (window.confirm(`¿Eliminar "${product.name}"? No se puede deshacer.`)) run(() => catalogService.deleteProduct(product.id), 'Producto eliminado.');
  };

  return (
    <tr className="border-t border-ocre/40 align-middle">
      <td className="p-3">{product.name}</td>
      <td className="p-3"><input type="number" min="0" value={d.price} onChange={set('price')} className={`${input} w-24`} aria-label={`Precio de ${product.name}`} /></td>
      <td className="p-3"><input type="number" min="0" step="1" value={d.stock} onChange={set('stock')} className={`${input} w-20 ${stock < 10 ? 'border-terracota' : ''}`} aria-label={`Stock de ${product.name}`} /></td>
      <td className="p-3"><input value={d.imageUrl} onChange={set('imageUrl')} placeholder="https://…" className={`${input} w-40`} aria-label={`Imagen de ${product.name}`} /></td>
      <td className="whitespace-nowrap p-3 text-right">
        <button onClick={save} disabled={!dirty || !valid || busy} className="rounded-lg bg-ocre px-3 py-1 text-sm font-bold text-cafe disabled:cursor-not-allowed disabled:opacity-40">Guardar</button>
        <button onClick={remove} disabled={busy} className={`ml-2 text-sm underline ${danger}`}>Eliminar</button>
      </td>
    </tr>
  );
}

function NewProductForm({ onCreated }) {
  const { notify } = useToast();
  const empty = { name: '', description: '', price: '', stock: '', imageUrl: '' };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const valid = f.name.trim().length >= 3 && Number(f.price) > 0 && f.stock !== '' && Number.isInteger(Number(f.stock)) && Number(f.stock) >= 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await catalogService.createProduct({
        name: f.name.trim(), description: f.description.trim(), price: Number(f.price), stock: Number(f.stock),
        ...(f.imageUrl.trim() && { imageUrl: f.imageUrl.trim() }),
      });
      notify('Producto creado.', 'success');
      setF(empty); setOpen(false); onCreated();
    } catch (err) {
      notify(err.message, 'error', 6000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-3">
      <button onClick={() => setOpen((o) => !o)} className="rounded-full bg-lima px-4 py-1.5 text-sm font-bold text-cafe">{open ? 'Cancelar' : '+ Nuevo producto'}</button>
      <AnimatePresence>
        {open && (
          <motion.form onSubmit={submit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Nombre" value={f.name} onChange={set('name')} />
              <input className={input} placeholder="URL de la imagen (opcional)" value={f.imageUrl} onChange={set('imageUrl')} />
              <input className={input} type="number" min="1" placeholder="Precio" value={f.price} onChange={set('price')} />
              <input className={input} type="number" min="0" step="1" placeholder="Stock" value={f.stock} onChange={set('stock')} />
              <textarea className={`${input} sm:col-span-2`} rows="2" placeholder="Descripción" value={f.description} onChange={set('description')} />
            </div>
            <button type="submit" disabled={!valid || busy} className="mt-3 rounded-lg bg-ocre px-4 py-2 text-sm font-bold text-cafe disabled:opacity-40">{busy ? 'Creando…' : 'Crear producto'}</button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('orders');
  const [filter, setFilter] = useState('TODOS');
  const orders = useAsync(() => orderService.list(), []);
  const products = useProducts();

  const statuses = [...new Set([...KNOWN_STATUSES, ...(orders.data ?? []).map((o) => o.status)])];
  const shown = (orders.data ?? []).filter((o) => filter === 'TODOS' || o.status === filter);

  const chip = (active, onClick, label) => (
    <button key={label} onClick={onClick} aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-sm font-medium ${active ? 'bg-lima text-cafe' : 'bg-oliva-claro/15 text-cafe dark:text-crema'}`}>{label}</button>
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-cafe dark:text-crema">Panel de administración</h1>
      <div className="mt-5 flex gap-2">{chip(tab === 'orders', () => setTab('orders'), 'Pedidos')}{chip(tab === 'stock', () => setTab('stock'), 'Productos y stock')}</div>

      {tab === 'orders' && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {['TODOS', ...statuses].map((s) => chip(filter === s, () => setFilter(s), s))}
            <button onClick={orders.reload} className="ml-auto text-sm underline">Actualizar</button>
          </div>
          {orders.loading && <p>Cargando pedidos…</p>}
          {orders.error && <p className={danger}>{orders.error.message}</p>}
          {orders.data && shown.length === 0 && <p className="rounded-xl bg-oliva-claro/10 p-4">No hay pedidos para mostrar.</p>}
          <ul className="space-y-3">{shown.map((o) => <OrderCard key={o.id} order={o} statuses={statuses} />)}</ul>
        </div>
      )}

      {tab === 'stock' && (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-oliva">
          <NewProductForm onCreated={products.reload} />
          {products.loading && <p className="p-4">Cargando…</p>}
          {products.error && <p className={`p-4 ${danger}`}>{products.error.message}</p>}
          {products.data && (
            <table className="w-full text-left text-sm text-cafe dark:text-crema">
              <thead className="bg-cafe text-crema">
                <tr><th className="p-3">Producto</th><th className="p-3">Precio</th><th className="p-3">Stock</th><th className="p-3">Imagen</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {products.data.map((p) => <ProductRow key={`${p.id}:${p.price}:${p.stock}:${p.image}`} product={p} onChanged={products.reload} />)}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}