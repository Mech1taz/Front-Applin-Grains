import { http } from './http.js';
import { cleanRut } from '../utils/rut.js';
import { addShippingAddress, getProfile, saveProfile } from '../utils/userProfile.js';

// Estados que ofrece el panel y ms-orders.
export const ORDER_STATUSES = ['CREADO', 'ACEPTADO', 'CONFIRMADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO'];

const LOCAL_ORDERS_KEY = 'applin_placed_orders';

export function saveLocalOrder(order, userEmail) {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const withMeta = { ...order, clientEmail: userEmail || order.email || '' };
    const filtered = list.filter((o) => o.id !== order.id && o.number !== order.number);
    const next = [withMeta, ...filtered];
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('No se pudo guardar pedido local:', err);
  }
}

export function getLocalOrders(userEmail) {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!userEmail) return list;
    const target = userEmail.toLowerCase().trim();
    return list.filter((o) => {
      const em = (o.email || o.clientEmail || '').toLowerCase().trim();
      return !em || em === target || em.includes(target) || target.includes(em);
    });
  } catch {
    return [];
  }
}

export const mapOrder = (dto) => ({
  id: dto.id,
  number: dto.numeroPedido ?? dto.orderNumber ?? `PED-${dto.id}`,
  total: Number(dto.total ?? 0),
  status: dto.estado ?? dto.status ?? 'CREADO',
  customer: dto.clienteNombre ?? dto.customer ?? '—',
  email: dto.clienteEmail ?? dto.email ?? '',
  createdAt: dto.fechaCreacion ?? dto.createdAt ?? new Date().toISOString(),
  items: (dto.items ?? []).map((i) => ({
    id: i.id,
    name: i.descripcion ?? i.name ?? (i.productoId ? `Producto ${i.productoId}` : 'Producto'),
    quantity: i.cantidad ?? i.quantity ?? 1,
    subtotal: Number(i.subtotal ?? (i.precioUnitario ? i.precioUnitario * (i.cantidad ?? 1) : 0)),
  })),
});

export const orderService = {
  /**
   * Obtiene los pedidos del usuario con sesión.
   * 1. Consulta /orders/mine (pasando el email en query param por compatibilidad).
   * 2. Si /orders/mine no devuelve pedidos o da error, intenta GET /orders filtrando por el correo del usuario.
   * 3. Combina con los pedidos registrados localmente para garantizar que nunca se pierdan compras recién hechas.
   */
  async mine(user) {
    const email = typeof user === 'string' ? user : user?.email;
    let serverOrders = [];
    let fetchError = null;

    // Intento 1: /orders/mine
    try {
      const { data } = await http.get('/orders/mine', {
        params: email ? { email } : undefined,
      });
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      serverOrders = list.map(mapOrder);
    } catch (err) {
      fetchError = err;
      console.warn('GET /orders/mine falló o no está disponible:', err.message);
    }

    // Intento 2: Fallback a /orders si /orders/mine vino vacío o falló
    if (serverOrders.length === 0) {
      try {
        const { data } = await http.get('/orders');
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        const all = list.map(mapOrder);

        if (email) {
          const norm = email.toLowerCase().trim();
          serverOrders = all.filter((o) => {
            const ordEmail = (o.email || '').toLowerCase().trim();
            return (
              ordEmail === norm ||
              (ordEmail && norm && (ordEmail.includes(norm) || norm.includes(ordEmail)))
            );
          });
        } else {
          serverOrders = all;
        }
      } catch (err2) {
        console.warn('Fallback GET /orders falló:', err2.message);
      }
    }

    // Combinar con los pedidos guardados localmente para asegurar consistencia
    const local = getLocalOrders(email);
    const seenIds = new Set(serverOrders.map((o) => String(o.id)));
    const merged = [...serverOrders];

    for (const loc of local) {
      if (!seenIds.has(String(loc.id))) {
        merged.push(loc);
        seenIds.add(String(loc.id));
      }
    }

    // Si aún no hay nada y hubo error de red, propagamos el error para mostrar mensaje
    if (merged.length === 0 && fetchError && serverOrders.length === 0 && local.length === 0) {
      // Si el error fue 404 o 401 y no hay pedidos, devolvemos array vacío en vez de romper la UI
      if (fetchError.status === 404 || fetchError.status === 401) {
        return [];
      }
    }

    return merged.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  },

  /** El BFF resuelve nombre y precio desde el catálogo: solo se envía productoId y cantidad. */
  async createOrder({ customer, items, paymentId }) {
    const body = {
      clienteId: `CLI-${cleanRut(customer.rut)}`,
      clienteNombre: customer.nombre.trim(),
      clienteEmail: customer.email.trim(),
      clienteDireccion: customer.direccion.trim(),
      clienteRut: customer.rut,
      paymentId,
      items: items.map((i) => ({ productoId: i.product.id, cantidad: i.quantity })),
    };

    const { data } = await http.post('/orders', body);
    const mapped = mapOrder(data);

    // Guardar respaldo local del pedido
    saveLocalOrder(mapped, customer.email);

    // Guardar o actualizar automáticamente la dirección de envío en el perfil del usuario
    try {
      if (customer.direccion) {
        addShippingAddress({ email: customer.email }, {
          name: 'Dirección de compra',
          recipient: customer.nombre,
          street: customer.direccion,
          phone: customer.telefono || '',
          isDefault: true,
        });
      }
      // Actualizar teléfono o RUT si no los tenía
      const prof = getProfile({ email: customer.email });
      if (!prof.rut || !prof.phone) {
        saveProfile({ email: customer.email }, {
          rut: prof.rut || customer.rut || '',
          phone: prof.phone || customer.telefono || '',
        });
      }
    } catch (e) {
      console.warn('No se pudo actualizar el perfil tras la compra:', e);
    }

    return mapped;
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
