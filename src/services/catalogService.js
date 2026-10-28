import { http, ApiError } from './http.js';

export { ApiError };

/** ProductResponseDto del BFF -> modelo del frontend. */
const mapProduct = (dto) => ({
  id: dto.id,
  name: dto.name ?? dto.nombre ?? 'Sin nombre',
  description: dto.description ?? dto.descripcion ?? '',
  price: Number(dto.price ?? dto.precio ?? 0),
  image: dto.imageUrl ?? dto.imagen ?? dto.image ?? null,
  stock: Number(dto.stock ?? 0),
});

export const catalogService = {
  // --- Administración (el BFF exige rol Admin) ---
  async createProduct(payload) {
    const { data } = await http.post('/catalog/products', payload);
    return mapProduct(data);
  },

  /** ProductUpdateDto: price, stock y/o imageUrl (cada uno opcional). */
  async updateProduct(id, payload) {
    const { data } = await http.put(`/catalog/products/${id}`, payload);
    return mapProduct(data);
  },

  async deleteProduct(id) {
    await http.delete(`/catalog/products/${id}`);
  },


  async getProducts() {
    const { data } = await http.get('/catalog/products');
    const list = Array.isArray(data) ? data : (data.content ?? []);
    return list.map(mapProduct);
  },

  async getProductById(id) {
    const { data } = await http.get(`/catalog/products/${id}`);
    return mapProduct(data);
  },

  /** Revalida stock con el servidor antes de crear el pedido. */
  async validateCart(items) {
    const fresh = await Promise.all(items.map((i) => this.getProductById(i.product.id)));
    fresh.forEach((p, idx) => {
      if (p.stock < items[idx].quantity) {
        throw new ApiError(
          p.stock === 0 ? `"${p.name}" se agotó.` : `Solo quedan ${p.stock} unidades de "${p.name}".`,
          { status: 409, code: 'InvalidStockException' }
        );
      }
    });
    return fresh;
  },
};
