const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
export const formatPrice = (n) => clp.format(n);

export const normalize = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const formatMinutes = (m = 0) => {
  if (m < 1) return '< 1 min';
  if (m < 60) return `${Math.round(m)} min`;
  const h = m / 60;
  return h < 24 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} d`;
};
export const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString('es-CL') : '—');
