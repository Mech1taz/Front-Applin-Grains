import { http } from './http.js';

export const paymentService = {
  /**
   * Pasarela SIMULADA: el BFF recalcula el monto desde el catálogo, valida la tarjeta
   * y devuelve un paymentId que luego exige POST /orders. Estado 402 = pago rechazado.
   */
  async charge({ items, card }) {
    const { data } = await http.post('/payments/charge', {
      items: items.map((i) => ({ productoId: i.product.id, cantidad: i.quantity })),
      card: {
        number: card.number.replace(/\s/g, ''),
        name: card.name.trim(),
        expiry: card.expiry,
        cvv: card.cvv,
      },
    });
    return data; // { paymentId, status, authorizationCode, amount, brand, last4 }
  },
};
