import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';
import { paymentService } from '../services/paymentService.js';
import { orderService } from '../services/orderService.js';
import CardPreview from './CardPreview.jsx';
import { formatCardNumber, formatExpiry, luhn, validExpiry } from '../utils/card.js';
import { formatPrice } from '../utils/format.js';

const STAGES = ['Verificando tu tarjeta…', 'Contactando a tu banco…', 'Autorizando el pago…', 'Confirmando tu pedido…'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextYear = String((new Date().getFullYear() + 3) % 100).padStart(2, '0');
const TEST_CARDS = [
  { label: 'Aprobada', number: '4242 4242 4242 4242' },
  { label: 'Rechazada', number: '4000 0000 0000 0002' },
  { label: 'Sin fondos', number: '4000 0000 0000 9995' },
];

const inputCls =
  'w-full rounded-lg border border-oliva-claro/40 bg-white px-3 py-2 text-cafe outline-none focus:border-ocre dark:bg-oliva dark:text-crema';
const btn = 'w-full rounded-xl py-3 font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50';
const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

export default function PaymentStep({ customer, onBack, onSuccess }) {
  const { items, total, clear } = useCart();
  const [card, setCard] = useState({ number: '', name: customer.nombre.toUpperCase(), expiry: '', cvv: '' });
  const [focus, setFocus] = useState(null);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('form'); // form | processing | failed
  const [stage, setStage] = useState(0);
  const [failure, setFailure] = useState(null);

  // Mensajes de progreso mientras el BFF verifica (el último se fija al autorizar)
  useEffect(() => {
    if (phase !== 'processing') return undefined;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 2)), 800);
    return () => clearInterval(t);
  }, [phase]);

  const set = (key, fmt = (v) => v) => (e) => setCard((c) => ({ ...c, [key]: fmt(e.target.value) }));

  const validate = () => {
    const e = {};
    if (!luhn(card.number)) e.number = 'Número de tarjeta no válido.';
    if (card.name.trim().length < 3) e.name = 'Escribe el nombre como aparece en la tarjeta.';
    if (!validExpiry(card.expiry)) e.expiry = 'Fecha inválida o vencida.';
    if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = 'CVV inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pay = async (ev) => {
    ev.preventDefault();
    if (phase === 'processing' || !validate()) return;
    setPhase('processing');
    setStage(0);
    try {
      // La animación dura al menos 2,4 s aunque el BFF responda antes
      const [res] = await Promise.allSettled([paymentService.charge({ items, card }), sleep(2400)]);
      if (res.status === 'rejected') throw res.reason;
      setStage(STAGES.length - 1);
      const order = await orderService.createOrder({ customer, items, paymentId: res.value.paymentId });
      clear(); // el carrito se vacía SOLO si el pedido quedó creado
      onSuccess({ ...order, authCode: res.value.authorizationCode });
    } catch (err) {
      setFailure({
        title: err.status === 402 ? 'Pago rechazado' : 'No pudimos completar tu compra',
        message: err.message,
      });
      setPhase('failed');
    }
  };

  const field = (label, key, props = {}, fmt) => (
    <label className="block text-sm font-medium text-cafe dark:text-crema">
      {label}
      <input
        className={`${inputCls} mt-1`} value={card[key]} onChange={set(key, fmt)} aria-invalid={!!errors[key]}
        onFocus={() => setFocus(key)} onBlur={() => setFocus(null)} {...props}
      />
      {errors[key] && <span className="text-xs text-terracota dark:text-lima">{errors[key]}</span>}
    </label>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="flex min-h-0 flex-1 flex-col">
      <AnimatePresence mode="wait">
        {phase === 'form' && (
          <motion.form key="form" {...fade} onSubmit={pay} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <CardPreview {...card} flipped={focus === 'cvv'} />
              <p className="rounded-lg bg-lima/40 px-3 py-2 text-xs text-cafe dark:text-crema">
                🧪 Modo simulación: no se realiza ningún cobro real. Prueba con una tarjeta de ejemplo:
              </p>
              <div className="flex flex-wrap gap-2">
                {TEST_CARDS.map((t) => (
                  <button
                    key={t.label} type="button"
                    onClick={() => setCard((c) => ({ ...c, number: t.number, expiry: `12/${nextYear}`, cvv: '123' }))}
                    className="rounded-full bg-oliva-claro/20 px-3 py-1 text-xs font-medium text-cafe hover:bg-oliva-claro/35 dark:text-crema"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {field('Número de tarjeta', 'number', { inputMode: 'numeric', autoComplete: 'cc-number', placeholder: '4242 4242 4242 4242' }, formatCardNumber)}
              {field('Nombre en la tarjeta', 'name', { autoComplete: 'cc-name' }, (v) => v.toUpperCase())}
              <div className="grid grid-cols-2 gap-3">
                {field('Vencimiento', 'expiry', { inputMode: 'numeric', autoComplete: 'cc-exp', placeholder: 'MM/AA' }, formatExpiry)}
                {field('CVV', 'cvv', { inputMode: 'numeric', autoComplete: 'cc-csc', placeholder: '123', maxLength: 4 }, (v) => v.replace(/\D/g, ''))}
              </div>
            </div>
            <div className="space-y-3 border-t border-oliva-claro/20 p-4">
              <button type="submit" className={`${btn} bg-ocre text-cafe dark:bg-terracota-muted dark:text-crema`}>
                🔒 Pagar {formatPrice(total)}
              </button>
              <button type="button" onClick={onBack} className="w-full text-sm underline">Volver a mis datos</button>
            </div>
          </motion.form>
        )}

        {phase === 'processing' && (
          <motion.div key="processing" {...fade} className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="relative h-28 w-28">
              <motion.span
                className="absolute inset-0 rounded-full border-4 border-oliva-claro/25 border-t-ocre"
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              />
              <motion.span
                className="absolute inset-0 flex items-center justify-center text-4xl"
                animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
              >
                ☕
              </motion.span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="font-display text-lg font-bold text-cafe dark:text-crema"
              >
                {STAGES[stage]}
              </motion.p>
            </AnimatePresence>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-oliva-claro/20">
              <motion.div className="h-full bg-ocre" animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} />
            </div>
            <p className="text-xs">No cierres esta ventana</p>
          </motion.div>
        )}

        {phase === 'failed' && (
          <motion.div key="failed" {...fade} className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <motion.div
              animate={{ x: [0, -10, 10, -8, 8, 0] }} transition={{ duration: 0.5 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-terracota/15 text-4xl text-terracota dark:text-lima"
            >
              ✕
            </motion.div>
            <h3 className="font-display text-2xl font-bold text-cafe dark:text-crema">{failure?.title}</h3>
            <p className="max-w-xs text-sm">{failure?.message}</p>
            <button onClick={() => setPhase('form')} className={`${btn} bg-ocre text-cafe dark:bg-terracota-muted dark:text-crema`}>Probar con otra tarjeta</button>
            <button onClick={onBack} className="text-sm underline">Volver al carrito</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
