// Manejo de productos favoritos en localStorage
const FAVORITES_KEY = 'applin_favorites';

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(productId) {
  const list = getFavorites();
  return list.some((item) => String(item.id) === String(productId));
}

export function toggleFavorite(product) {
  const list = getFavorites();
  const exists = list.some((item) => String(item.id) === String(product.id));
  let updated;
  if (exists) {
    updated = list.filter((item) => String(item.id) !== String(product.id));
  } else {
    updated = [
      ...list,
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        stock: product.stock,
      },
    ];
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('applin-favorites-changed', { detail: updated }));
  return !exists;
}

export function getFavoritesCount() {
  return getFavorites().length;
}
