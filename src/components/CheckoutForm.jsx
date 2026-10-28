import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { catalogService } from '../services/catalogService.js';
import { orderService } from '../services/orderService.js';
import { formatRut } from '../utils/rut.js';
import { isValidRut } from '../utils/rut.js';
import { formatPrice } from '../utils/format.js';

const FIELDS = [
  { key: 'nombre', label: 'Nombre completo', type: 'text', autoComplete: 'name' },
  { key: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
  { key: 'rut', label: 'RUT', type: 'text', placeholder: '12.345.678-5' },
  { key: 'direccion', label: 'Dirección de despacho', type: 'text', autoComplete: 'street-address' },
];

const inputCls =
  'w-full rounded-lg border border-oliva-claro/40 bg-white px-3 py-2 text-cafe outline-none focus:border-ocre dark:bg-oliva dark:text-crema';

export default function CheckoutForm({ onBack, onSuccess }) {
  const { items, total, clear } = useCart();
  const { notify } = useToast();
  const { enabled, user } = useAuth();
  const [form, setForm] = useState({ nombre: user?.name ?? '', email: user?.email ?? '', rut: '', direccion: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const onChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: key === 'rut' ? formatRut(e.target.value) : e.target.value }));

  const validate = () => {
    const e = {};
    if (form.nombre.trim().length < 3) e.nombre = 'Ingresa tu nombre completo.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Correo no válido.';
    if (!isValidRut(form.rut)) e.rut = 'RUT no válido.';
    if (form.direccion.trim().length < 6) e.direccion = 'Ingresa tu dirección.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (enabled && !user) { notify('Inicia sesión para comprar.', 'error'); return; }
    if (busy || !validate()) return;
    setBusy(true);
    try {
      await catalogService.validateCart(items); // stock fresco antes de pedir
      onSuccess(form); // pasa al pago: el pedido se crea solo si el pago se aprueba
    } catch (err) {
      notify(err.message, 'error', 6000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="block text-sm font-medium text-cafe dark:text-crema">
            {f.label}
            <input
              className={`${inputCls} mt-1`}
              type={f.type}
              value={form[f.key]}
              onChange={onChange(f.key)}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              aria-invalid={!!errors[f.key]}
            />
            {errors[f.key] && <span className="text-xs text-terracota dark:text-lima">{errors[f.key]}</span>}
          </label>
        ))}
      </div>
      <div className="space-y-3 border-t border-oliva-claro/20 p-4">
        <div className="flex justify-between text-lg font-bold text-cafe dark:text-crema">
          <span>Total</span><span>{formatPrice(total)}</span>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-ocre py-3 font-bold text-cafe transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-terracota-muted dark:text-crema"
        >
          {busy ? 'Verificando stock…' : 'Continuar al pago'}
        </button>
        <button type="button" onClick={onBack} disabled={busy} className="w-full text-sm underline">Volver al carrito</button>
      </div>
    </form>
  );
}
