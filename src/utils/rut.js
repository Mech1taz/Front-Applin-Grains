export const cleanRut = (v = '') => v.replace(/[^0-9kK]/g, '').toUpperCase();

export function formatRut(v) {
  const c = cleanRut(v);
  if (c.length < 2) return c;
  return `${c.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${c.slice(-1)}`;
}

/** Valida largo y dígito verificador (módulo 11). */
export function isValidRut(v) {
  const c = cleanRut(v);
  if (c.length < 8) return false;
  const body = c.slice(0, -1);
  let sum = 0, m = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * m;
    m = m === 7 ? 2 : m + 1;
  }
  const r = 11 - (sum % 11);
  return c.slice(-1) === (r === 11 ? '0' : r === 10 ? 'K' : String(r));
}
