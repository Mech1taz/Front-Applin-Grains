// Manejo de datos de perfil, direcciones y suscripciones en almacenamiento local
const PROFILE_KEY = (userId) => `applin_profile:${userId || 'default'}`;

export function getProfile(user) {
  const userId = user?.id || user?.email || 'default';
  const raw = localStorage.getItem(PROFILE_KEY(userId));
  const fallback = {
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    rut: '',
    shippingAddresses: [],
    billingAddresses: [],
    subscriptions: {
      coffeeClub: false,
      coffeeClubPlan: '2 bolsas de 250g mensuales (Grano entero)',
      frequency: 'Cada 30 días',
      newsletter: true,
    },
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      name: parsed.name || user?.name || '',
      email: parsed.email || user?.email || '',
      shippingAddresses: Array.isArray(parsed.shippingAddresses) ? parsed.shippingAddresses : [],
      billingAddresses: Array.isArray(parsed.billingAddresses) ? parsed.billingAddresses : [],
      subscriptions: { ...fallback.subscriptions, ...(parsed.subscriptions || {}) },
    };
  } catch {
    return fallback;
  }
}

export function saveProfile(user, updates) {
  const userId = user?.id || user?.email || 'default';
  const current = getProfile(user);
  const next = { ...current, ...updates };
  localStorage.setItem(PROFILE_KEY(userId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('applin-profile-changed', { detail: next }));
  return next;
}

export function addShippingAddress(user, address) {
  const current = getProfile(user);
  const newAddr = {
    id: `addr_${Date.now()}`,
    name: address.name || 'Dirección de entrega',
    recipient: address.recipient || current.name || '',
    street: address.street || address.direccion || '',
    depto: address.depto || '',
    comuna: address.comuna || '',
    city: address.city || 'Santiago',
    region: address.region || 'Región Metropolitana',
    phone: address.phone || current.phone || '',
    notes: address.notes || '',
    isDefault: current.shippingAddresses.length === 0 || !!address.isDefault,
  };

  const list = address.isDefault
    ? current.shippingAddresses.map((a) => ({ ...a, isDefault: false })).concat(newAddr)
    : [...current.shippingAddresses, newAddr];

  return saveProfile(user, { shippingAddresses: list });
}

export function updateShippingAddress(user, id, updates) {
  const current = getProfile(user);
  const list = current.shippingAddresses.map((a) => (a.id === id ? { ...a, ...updates } : a));
  return saveProfile(user, { shippingAddresses: list });
}

export function removeShippingAddress(user, id) {
  const current = getProfile(user);
  const list = current.shippingAddresses.filter((a) => a.id !== id);
  if (list.length > 0 && !list.some((a) => a.isDefault)) {
    list[0].isDefault = true;
  }
  return saveProfile(user, { shippingAddresses: list });
}

export function addBillingAddress(user, billing) {
  const current = getProfile(user);
  const newBill = {
    id: `bill_${Date.now()}`,
    businessName: billing.businessName || billing.razonSocial || current.name || '',
    rut: billing.rut || '',
    giro: billing.giro || 'Giro comercial general',
    address: billing.address || billing.direccion || '',
    comuna: billing.comuna || '',
    city: billing.city || 'Santiago',
    email: billing.email || current.email || '',
    isDefault: current.billingAddresses.length === 0 || !!billing.isDefault,
  };

  const list = billing.isDefault
    ? current.billingAddresses.map((b) => ({ ...b, isDefault: false })).concat(newBill)
    : [...current.billingAddresses, newBill];

  return saveProfile(user, { billingAddresses: list });
}

export function updateBillingAddress(user, id, updates) {
  const current = getProfile(user);
  const list = current.billingAddresses.map((b) => (b.id === id ? { ...b, ...updates } : b));
  return saveProfile(user, { billingAddresses: list });
}

export function removeBillingAddress(user, id) {
  const current = getProfile(user);
  const list = current.billingAddresses.filter((b) => b.id !== id);
  if (list.length > 0 && !list.some((b) => b.isDefault)) {
    list[0].isDefault = true;
  }
  return saveProfile(user, { billingAddresses: list });
}
