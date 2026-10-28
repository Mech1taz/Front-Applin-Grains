import { motion } from 'framer-motion';
import { detectBrand, onlyDigits } from '../utils/card.js';

/** Tarjeta que se completa en vivo y gira al escribir el CVV. */
export default function CardPreview({ number, name, expiry, cvv, flipped }) {
  const shown = onlyDigits(number).padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
  const brand = detectBrand(number);
  const face = 'absolute inset-0 rounded-2xl text-crema shadow-xl [backface-visibility:hidden] bg-gradient-to-br from-cafe via-oliva to-oliva-claro';

  return (
    <div className="mx-auto h-48 w-full max-w-sm [perspective:1000px]">
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      >
        <div className={`${face} flex flex-col justify-between p-5`}>
          <div className="flex items-start justify-between">
            <span className="h-8 w-11 rounded-md bg-ocre/90" />
            <span className="text-sm font-bold tracking-widest">{brand ?? 'TARJETA'}</span>
          </div>
          <p className="font-mono text-xl tracking-widest">{shown}</p>
          <div className="flex items-end justify-between text-xs uppercase">
            <span className="max-w-[70%] truncate">{name || 'Nombre Apellido'}</span>
            <span className="font-mono">{expiry || 'MM/AA'}</span>
          </div>
        </div>
        <div className={`${face} [transform:rotateY(180deg)]`}>
          <div className="mt-6 h-10 bg-black/70" />
          <div className="mx-5 mt-5 rounded bg-crema px-3 py-2 text-right font-mono text-cafe">{cvv || '•••'}</div>
          <p className="mx-5 mt-3 text-[10px] opacity-70">Applin &amp; Grain · Pasarela de simulación</p>
        </div>
      </motion.div>
    </div>
  );
}
