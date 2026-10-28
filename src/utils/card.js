export const onlyDigits = (v = '') => v.replace(/\D/g, '');
export const formatCardNumber = (v) => onlyDigits(v).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

export function formatExpiry(v) {
  const d = onlyDigits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function detectBrand(number) {
  const d = onlyDigits(number);
  if (/^4/.test(d)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'MASTERCARD';
  return null;
}

/** Algoritmo de Luhn: detecta números de tarjeta mal escritos. */
export function luhn(number) {
  const d = onlyDigits(number);
  if (d.length < 13) return false;
  let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let x = Number(d[i]);
    if (alt) { x *= 2; if (x > 9) x -= 9; }
    sum += x;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function validExpiry(v) {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1) > new Date() && year <= new Date().getFullYear() + 10;
}
