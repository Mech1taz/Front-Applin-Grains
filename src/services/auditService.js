import { http } from './http.js';

export const EVENT_TYPES = [
  'OrderCreated',
  'OrderAccepted',
  'OrderPreparing',
  'OrderDispatched',
  'OrderDelivered',
  'OrderCancelled',
];

export const EVENT_TRANSLATIONS = {
  OrderCreated: 'Pedido creado',
  OrderAccepted: 'Pedido aceptado',
  OrderPreparing: 'En preparación',
  OrderDispatched: 'Despachado',
  OrderDelivered: 'Entregado',
  OrderCancelled: 'Cancelado',
  UnknownEvent: 'Evento del sistema',
};

export const formatEventType = (type) => {
  if (!type) return 'Evento del sistema';
  return EVENT_TRANSLATIONS[type] || type.replace(/([A-Z])/g, ' $1').trim();
};

const mapEvent = (e) => ({
  id: e.id ?? e.eventId,
  type: e.eventType ?? '',
  entityType: e.entityType ?? '',
  entityId: e.entityId ?? '',
  actor: e.actorName || e.actorEmail || e.actorId || 'Sistema',
  email: e.actorEmail ?? '',
  summary: e.actionSummary ?? '',
  from: e.previousState ?? '',
  to: e.newState ?? '',
  source: e.source ?? '',
  at: e.timestamp ?? null,
});

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));

export const auditService = {
  /** Filtros: usuario, eventType, from/to (YYYY-MM-DD, se convierten a instantes UTC). */
  async events({ usuario, eventType, from, to, page = 0, size = 15 }) {
    const { data } = await http.get('/audit/events', {
      params: clean({
        usuario: usuario?.trim(),
        eventType,
        from: from && `${from}T00:00:00Z`,
        to: to && `${to}T23:59:59Z`,
        page,
        size,
      }),
    });
    return {
      items: (data.content ?? []).map(mapEvent),
      totalPages: data.totalPages ?? 0,
      total: data.totalElements ?? 0,
      page: data.number ?? page,
    };
  },
  async timeline(orderId) {
    const { data } = await http.get(`/audit/orders/${orderId}/timeline`);
    return (Array.isArray(data) ? data : []).map(mapEvent);
  },
};
