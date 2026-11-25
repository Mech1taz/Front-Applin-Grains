import { http } from './http.js';

const n = (v) => Number(v ?? 0);
const q = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

const mapSales = (d) => ({ date: d.date, orders: n(d.orderCount), amount: n(d.totalAmount) });
const mapTop = (p) => ({ id: p.productoId, name: p.descripcion ?? `Producto ${p.productoId}`, units: n(p.totalQuantitySold), revenue: n(p.totalRevenue) });
const mapLead = (l = {}) => ({
  phases: [
    { key: 'accept', label: 'Aceptación', min: n(l.avgAcceptMinutes) },
    { key: 'prepare', label: 'Preparación', min: n(l.avgPrepareMinutes) },
    { key: 'dispatch', label: 'Despacho', min: n(l.avgDispatchMinutes) },
    { key: 'delivery', label: 'Entrega', min: n(l.avgDeliveryMinutes) },
  ],
  total: n(l.avgTotalMinutes),
});

export const reportService = {
  async summary() {
    const { data } = await http.get('/reports/summary');
    return { orders: n(data.totalOrders), sales: n(data.totalSales), ticket: n(data.averageTicket), leadTotal: mapLead(data.leadTime).total };
  },
  async salesChart({ from, to } = {}) {
    const { data } = await http.get('/reports/sales-chart', { params: q({ from, to }) });
    return (Array.isArray(data) ? data : []).map(mapSales);
  },
  async leadTimeChart() {
    const { data } = await http.get('/reports/lead-time-chart');
    return mapLead(data);
  },
  async topProducts(limit = 10) {
    const { data } = await http.get('/reports/top-products-chart', { params: { limit } });
    return (Array.isArray(data) ? data : []).map(mapTop);
  },
};
