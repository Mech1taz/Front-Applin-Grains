import { http } from './http.js';
import { cleanRut } from '../utils/rut.js';

// Estados que ofrece el panel. Ajusta esta lista a los que acepta ms-orders.
export const ORDER_STATUSES = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'];

const mapOrder = (dto) => ({
  id: dto.id,
  number: dto.numeroPedido ?? dto.orderNumber ?? `PED-${dto.id}`,
  total: Number(dto.total ?? 0),
  status: dto.estado ?? '',
  customer: dto.clienteNombre ?? '—',
  email: dto.clienteEmail ?? '',
  createdAt: dto.fechaCreacion ?? null,
  items: (dto.items ?? []).map((i) => ({
    id: i.id,
    name: i.descripcion ?? `Producto ${i.productoId}`,
    quantity: i.cantidad,
    subtotal: Number(i.subtotal ?? 0),
  })),
});

export const orderService = {
  /** Pedidos del usuario con sesión (el BFF filtra por el correo del token). */
  async mine() {
    const { data } = await http.get('/orders/mine');
    return (Array.isArray(data) ? data : []).map(mapOrder).sort((a, b) => b.id - a.id);
  },

  /** El BFF resuelve nombre y precio desde el catálogo: solo se envía productoId y cantidad. */
  async createOrder({ customer, items, paymentId }) {
    const body = {
      clienteId: `CLI-${cleanRut(customer.rut)}`,
      clienteNombre: customer.nombre.trim(),
      clienteEmail: customer.email.trim(),
      clienteDireccion: customer.direccion.trim(),
      clienteRut: customer.rut,
      paymentId, // el BFF verifica que el pago exista, sea de este usuario y coincida con el monto
      items: items.map((i) => ({ productoId: i.product.id, cantidad: i.quantity })),
    };
    const { data } = await http.post('/orders', body);
    return mapOrder(data);
  },

  async list() {
    const { data } = await http.get('/orders');
    const list = Array.isArray(data) ? data : (data.content ?? []);
    return list.map(mapOrder).sort((a, b) => b.id - a.id);
  },

  async updateStatus(id, nuevoEstado) {
    const { data } = await http.put(`/orders/${id}/status`, { nuevoEstado });
    return data;
  },
};
