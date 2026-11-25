import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import { AVATARS, getAvatar, setAvatar } from '../utils/avatars.js';
import {
  getProfile,
  saveProfile,
  addShippingAddress,
  updateShippingAddress,
  removeShippingAddress,
  addBillingAddress,
  updateBillingAddress,
  removeBillingAddress,
} from '../utils/userProfile.js';
import { getFavorites, toggleFavorite } from '../utils/favorites.js';
import { orderService } from '../services/orderService.js';
import { formatPrice } from '../utils/format.js';
import { formatRut, isValidRut } from '../utils/rut.js';
import { OrderProgress, STATUS_COLORS, LABELS } from './MyOrders.jsx';

const TABS = [
  { id: 'pedidos', label: 'PEDIDOS', icon: 'list' },
  { id: 'suscripciones', label: 'SUSCRIPCIONES', icon: 'refresh' },
  { id: 'detalles', label: 'DETALLES', icon: 'info' },
  { id: 'favoritos', label: 'LISTA DE FAVORITOS', icon: 'heart' },
  { id: 'avatar', label: 'MI AVATAR', icon: 'user' },
];

export default function Profile() {
  const { user, isAdmin, logout } = useAuth();
  const { addItem, openCart } = useCart();
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState('detalles');
  const [profile, setProfileState] = useState(() => getProfile(user));
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Modales y estados de edición
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', rut: '' });

  const [shippingModal, setShippingModal] = useState({ open: false, editingId: null });
  const [shippingForm, setShippingForm] = useState({
    name: 'Casa',
    recipient: '',
    street: '',
    depto: '',
    comuna: '',
    city: 'Santiago',
    region: 'Región Metropolitana',
    phone: '',
    notes: '',
    isDefault: false,
  });

  const [billingModal, setBillingModal] = useState({ open: false, editingId: null });
  const [billingForm, setBillingForm] = useState({
    businessName: '',
    rut: '',
    giro: '',
    address: '',
    comuna: '',
    city: 'Santiago',
    isDefault: false,
  });

  const [, forceUpdate] = useState(0);

  // Sincronizar datos al montar y ante eventos
  useEffect(() => {
    if (!user) return;
    const current = getProfile(user);
    setProfileState(current);
    setContactForm({
      name: current.name || user.name || '',
      phone: current.phone || '',
      rut: current.rut || '',
    });

    const onProfileChange = (e) => setProfileState(e.detail);
    const onFavChange = (e) => setFavorites(e.detail);

    window.addEventListener('applin-profile-changed', onProfileChange);
    window.addEventListener('applin-favorites-changed', onFavChange);

    return () => {
      window.removeEventListener('applin-profile-changed', onProfileChange);
      window.removeEventListener('applin-favorites-changed', onFavChange);
    };
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await orderService.mine(user);
      setOrders(data);
    } catch (err) {
      setOrdersError(err.message || 'No pudimos cargar tus pedidos.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pedidos') {
      fetchOrders();
    }
  }, [activeTab, user]);

  if (!user) return null;
  const currentAvatar = getAvatar(user.id);

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (contactForm.rut && !isValidRut(contactForm.rut)) {
      notify('El RUT ingresado no es válido.', 'error');
      return;
    }
    const updated = saveProfile(user, {
      name: contactForm.name.trim() || user.name,
      phone: contactForm.phone.trim(),
      rut: contactForm.rut.trim(),
    });
    setProfileState(updated);
    setEditingContact(false);
    notify('Datos de contacto actualizados.', 'success');
  };

  const openNewShipping = () => {
    setShippingForm({
      name: 'Casa',
      recipient: profile.name || user.name || '',
      street: '',
      depto: '',
      comuna: '',
      city: 'Santiago',
      region: 'Región Metropolitana',
      phone: profile.phone || '',
      notes: '',
      isDefault: profile.shippingAddresses.length === 0,
    });
    setShippingModal({ open: true, editingId: null });
  };

  const openEditShipping = (addr) => {
    setShippingForm({ ...addr });
    setShippingModal({ open: true, editingId: addr.id });
  };

  const handleSaveShipping = (e) => {
    e.preventDefault();
    if (!shippingForm.street.trim()) {
      notify('Por favor ingresa la calle y número.', 'error');
      return;
    }
    if (shippingModal.editingId) {
      updateShippingAddress(user, shippingModal.editingId, shippingForm);
      notify('Dirección de envío actualizada.', 'success');
    } else {
      addShippingAddress(user, shippingForm);
      notify('Dirección de envío agregada.', 'success');
    }
    setShippingModal({ open: false, editingId: null });
  };

  const handleDeleteShipping = (id) => {
    removeShippingAddress(user, id);
    notify('Dirección eliminada.', 'info');
  };

  const openNewBilling = () => {
    setBillingForm({
      businessName: profile.name || user.name || '',
      rut: profile.rut || '',
      giro: '',
      address: '',
      comuna: '',
      city: 'Santiago',
      isDefault: profile.billingAddresses.length === 0,
    });
    setBillingModal({ open: true, editingId: null });
  };

  const openEditBilling = (bill) => {
    setBillingForm({ ...bill });
    setBillingModal({ open: true, editingId: bill.id });
  };

  const handleSaveBilling = (e) => {
    e.preventDefault();
    if (!billingForm.businessName.trim() || !billingForm.rut.trim()) {
      notify('Completa la razón social y el RUT.', 'error');
      return;
    }
    if (billingForm.rut && !isValidRut(billingForm.rut)) {
      notify('El RUT de facturación no es válido.', 'error');
      return;
    }
    if (billingModal.editingId) {
      updateBillingAddress(user, billingModal.editingId, billingForm);
      notify('Datos de facturación actualizados.', 'success');
    } else {
      addBillingAddress(user, billingForm);
      notify('Datos de facturación agregados.', 'success');
    }
    setBillingModal({ open: false, editingId: null });
  };

  const handleDeleteBilling = (id) => {
    removeBillingAddress(user, id);
    notify('Datos de facturación eliminados.', 'info');
  };

  const toggleClub = () => {
    const nextState = !profile.subscriptions.coffeeClub;
    saveProfile(user, {
      subscriptions: { ...profile.subscriptions, coffeeClub: nextState },
    });
    notify(
      nextState
        ? '¡Bienvenido al Club de Café! Recibirás tus granos cada mes.'
        : 'Suscripción al Club de Café pausada.',
      'info'
    );
  };

  const toggleNewsletter = () => {
    const nextState = !profile.subscriptions.newsletter;
    saveProfile(user, {
      subscriptions: { ...profile.subscriptions, newsletter: nextState },
    });
    notify(nextState ? 'Suscrito al boletín.' : 'Cancelada suscripción al boletín.', 'info');
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      {/* 1. Barra Superior del Perfil */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-oliva-claro/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar user={user} size={64} />
            <button
              onClick={() => setActiveTab('avatar')}
              title="Cambiar avatar"
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ocre text-cafe shadow transition hover:scale-110"
            >
              <Icon name="edit" size={12} />
            </button>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-cafe dark:text-crema">
                {profile.name || user.name}
              </h1>
              <span className="rounded-full bg-oliva-claro/20 px-2.5 py-0.5 text-xs font-semibold text-cafe dark:text-crema">
                {isAdmin ? 'Administrador' : 'Cliente'}
              </span>
              <span className="rounded-full bg-oliva-claro/10 px-2 py-0.5 text-[11px] opacity-75">
                {user.kind}
              </span>
            </div>
            <p className="text-sm font-medium opacity-80">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="rounded-full bg-cafe px-6 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-crema dark:text-cafe"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* 2. Pestañas de Navegación horizontales sin emojis */}
      <nav className="mt-6 flex flex-wrap items-center gap-2 border-b border-oliva-claro/20 pb-2 text-sm font-semibold sm:gap-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === 'favoritos' ? ` (${favorites.length})` : '';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                isActive
                  ? 'border-2 border-cafe bg-white font-bold text-cafe shadow-sm dark:border-crema dark:bg-oliva dark:text-crema'
                  : 'text-oliva-claro hover:text-cafe dark:text-crema/70 dark:hover:text-crema'
              }`}
            >
              <Icon name={tab.icon} size={15} />
              <span>
                {tab.label}
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 3. Contenido según pestaña */}
      <div className="mt-8">
        {/* TAB: DETALLES */}
        {activeTab === 'detalles' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Columna Izquierda: Detalles de contacto */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-oliva-claro/20 bg-white/70 p-6 shadow-sm backdrop-blur dark:bg-oliva/60">
                <div className="flex items-center justify-between border-b border-oliva-claro/15 pb-4">
                  <h2 className="font-display text-xl font-bold text-cafe dark:text-crema">
                    Detalles de contacto
                  </h2>
                  {!editingContact && (
                    <button
                      onClick={() => setEditingContact(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-oliva-claro/40 px-3 py-1 text-xs font-semibold text-cafe transition hover:bg-oliva-claro/15 dark:text-crema"
                    >
                      <Icon name="edit" size={13} />
                      Editar
                    </button>
                  )}
                </div>

                {!editingContact ? (
                  <div className="mt-5 space-y-4 text-sm">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-oliva-claro dark:text-crema/70">
                        CORREO ELECTRÓNICO
                      </span>
                      <p className="mt-0.5 font-medium text-cafe dark:text-crema">{user.email}</p>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-oliva-claro dark:text-crema/70">
                        NOMBRE COMPLETO
                      </span>
                      <p className="mt-0.5 font-medium text-cafe dark:text-crema">
                        {profile.name || user.name || 'Sin nombre registrado'}
                      </p>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-oliva-claro dark:text-crema/70">
                        TELÉFONO
                      </span>
                      <p className="mt-0.5 font-medium text-cafe dark:text-crema">
                        {profile.phone || '964819595'}
                      </p>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-oliva-claro dark:text-crema/70">
                        RUT
                      </span>
                      <p className="mt-0.5 font-medium text-cafe dark:text-crema">
                        {profile.rut || 'Sin RUT registrado'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveContact} className="mt-5 space-y-3">
                    <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                      Nombre completo
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-sm text-cafe dark:bg-cafe/50 dark:text-crema"
                      />
                    </label>

                    <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                      Teléfono
                      <input
                        type="tel"
                        placeholder="964819595"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-sm text-cafe dark:bg-cafe/50 dark:text-crema"
                      />
                    </label>

                    <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                      RUT
                      <input
                        type="text"
                        placeholder="12.345.678-5"
                        value={contactForm.rut}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, rut: formatRut(e.target.value) })
                        }
                        className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-sm text-cafe dark:bg-cafe/50 dark:text-crema"
                      />
                    </label>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-ocre px-4 py-1.5 text-xs font-bold text-cafe hover:brightness-105 dark:bg-terracota-muted dark:text-crema"
                      >
                        Guardar cambios
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingContact(false)}
                        className="rounded-lg border border-oliva-claro/30 px-3 py-1.5 text-xs font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Columna Derecha: Direcciones de Envío y Facturación */}
            <div className="space-y-6">
              {/* Card 1: Direcciones de envío */}
              <div className="rounded-2xl border border-oliva-claro/20 bg-white/70 p-6 shadow-sm backdrop-blur dark:bg-oliva/60">
                <h2 className="font-display text-xl font-bold text-cafe dark:text-crema">
                  Direcciones de envío
                </h2>

                {profile.shippingAddresses.length === 0 ? (
                  <p className="mt-3 text-sm text-oliva-claro dark:text-crema/80">
                    Aún no tienes datos de envío. Puedes incorporarlos haciendo clic en el botón de
                    abajo o se agregarán automáticamente cuando realices una compra.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {profile.shippingAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="relative rounded-xl border border-oliva-claro/25 bg-crema/30 p-4 text-sm dark:bg-cafe/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-cafe dark:text-crema">
                              {addr.name || 'Dirección de envío'}
                            </span>
                            {addr.isDefault && (
                              <span className="ml-2 rounded-full bg-ocre/30 px-2 py-0.5 text-[10px] font-bold text-cafe dark:text-crema">
                                Principal
                              </span>
                            )}
                            <p className="mt-1 font-medium text-cafe dark:text-crema">
                              {addr.street} {addr.depto && `(${addr.depto})`}
                            </p>
                            <p className="text-xs opacity-75">
                              {addr.comuna ? `${addr.comuna}, ` : ''}
                              {addr.city}
                            </p>
                            {addr.recipient && (
                              <p className="text-xs opacity-75">Recibe: {addr.recipient}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditShipping(addr)}
                              className="rounded p-1 text-xs hover:bg-oliva-claro/20"
                              title="Editar"
                            >
                              <Icon name="edit" size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteShipping(addr.id)}
                              className="rounded p-1 text-xs text-terracota hover:bg-terracota/10 dark:text-lima"
                              title="Eliminar"
                            >
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={openNewShipping}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cafe/40 px-4 py-2 text-xs font-bold text-cafe transition hover:bg-oliva-claro/15 dark:border-crema/40 dark:text-crema"
                >
                  <Icon name="plusCircle" size={15} />
                  Añadir Dirección De Envío
                </button>
              </div>

              {/* Card 2: Direcciones de Facturación */}
              <div className="rounded-2xl border border-oliva-claro/20 bg-white/70 p-6 shadow-sm backdrop-blur dark:bg-oliva/60">
                <h2 className="font-display text-xl font-bold text-cafe dark:text-crema">
                  Direcciones de Facturación
                </h2>

                {profile.billingAddresses.length === 0 ? (
                  <p className="mt-3 text-sm text-oliva-claro dark:text-crema/80">
                    Aún no tienes datos de facturación. Puedes incorporarlos haciendo clic en el
                    botón de abajo o se agregarán automáticamente cuando realices una compra.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {profile.billingAddresses.map((bill) => (
                      <div
                        key={bill.id}
                        className="relative rounded-xl border border-oliva-claro/25 bg-crema/30 p-4 text-sm dark:bg-cafe/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-cafe dark:text-crema">
                              {bill.businessName}
                            </span>
                            <p className="text-xs font-semibold text-ocre dark:text-lima">
                              RUT: {bill.rut}
                            </p>
                            {bill.giro && <p className="text-xs opacity-75">Giro: {bill.giro}</p>}
                            {bill.address && (
                              <p className="text-xs opacity-75">
                                Dirección fiscal: {bill.address} {bill.comuna ? `(${bill.comuna})` : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditBilling(bill)}
                              className="rounded p-1 text-xs hover:bg-oliva-claro/20"
                              title="Editar"
                            >
                              <Icon name="edit" size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteBilling(bill.id)}
                              className="rounded p-1 text-xs text-terracota hover:bg-terracota/10 dark:text-lima"
                              title="Eliminar"
                            >
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={openNewBilling}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cafe/40 px-4 py-2 text-xs font-bold text-cafe transition hover:bg-oliva-claro/15 dark:border-crema/40 dark:text-crema"
                >
                  <Icon name="plusCircle" size={15} />
                  Añadir Dirección De Facturación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PEDIDOS */}
        {activeTab === 'pedidos' && (
          <div>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-cafe dark:text-crema">
                  Historial de compras
                </h2>
                <p className="text-sm opacity-75">Seguimiento en tiempo real de tus pedidos.</p>
              </div>
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="flex items-center gap-1.5 rounded-full bg-oliva-claro/15 px-4 py-1.5 text-xs font-semibold text-cafe transition hover:bg-oliva-claro/30 disabled:opacity-50 dark:text-crema"
              >
                <Icon name="refresh" size={13} />
                {loadingOrders ? 'Actualizando…' : 'Actualizar pedidos'}
              </button>
            </div>

            {loadingOrders && (
              <div className="mt-4 h-36 animate-pulse rounded-2xl bg-oliva-claro/15" />
            )}

            {ordersError && (
              <div className="mt-4 rounded-2xl bg-terracota/10 p-4 text-terracota dark:text-lima">
                <p>{ordersError}</p>
                <button onClick={fetchOrders} className="mt-2 text-sm underline">
                  Reintentar
                </button>
              </div>
            )}

            {!loadingOrders && orders.length === 0 && (
              <div className="mt-6 rounded-2xl bg-white/70 p-10 text-center shadow-sm dark:bg-oliva/60">
                <Icon name="orders" size={40} className="mx-auto text-oliva-claro opacity-50" />
                <p className="mt-3 text-lg font-bold text-cafe dark:text-crema">
                  Aún no tienes pedidos registrados.
                </p>
                <p className="mt-1 text-sm opacity-70">
                  Explora nuestro catálogo de café de especialidad y realiza tu primer pedido.
                </p>
                <Link
                  to="/"
                  className="mt-5 inline-block rounded-xl bg-ocre px-6 py-2.5 font-bold text-cafe hover:brightness-110 dark:bg-terracota-muted dark:text-crema"
                >
                  Ver productos
                </Link>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {orders.map((o, idx) => (
                <motion.div
                  key={o.id || o.number || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-oliva-claro/20 bg-white p-6 shadow-sm dark:bg-oliva"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-cafe dark:text-crema">
                        {o.number}
                      </p>
                      <p className="text-xs opacity-75">
                        {new Date(o.createdAt).toLocaleString('es-CL', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      {o.customer && <p className="text-xs opacity-60">Cliente: {o.customer}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-cafe dark:text-lima">
                        {formatPrice(o.total)}
                      </p>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                          STATUS_COLORS[o.status] || 'bg-oliva-claro/20 text-cafe dark:text-crema'
                        }`}
                      >
                        {LABELS[o.status] ?? o.status}
                      </span>
                    </div>
                  </div>

                  <OrderProgress status={o.status} />

                  <ul className="mt-4 space-y-1.5 border-t border-oliva-claro/20 pt-3 text-sm">
                    {o.items.map((it, itIdx) => (
                      <li key={it.id || itIdx} className="flex justify-between">
                        <span>
                          <strong className="text-cafe dark:text-crema">{it.quantity}×</strong>{' '}
                          {it.name}
                        </span>
                        <span className="font-semibold text-cafe dark:text-crema">
                          {formatPrice(it.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SUSCRIPCIONES */}
        {activeTab === 'suscripciones' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-oliva-claro/20 bg-white/70 p-6 shadow-sm dark:bg-oliva/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oliva-claro/20 text-cafe dark:text-crema">
                  <Icon name="store" size={20} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-cafe dark:text-crema">
                    Club de Café Applin &amp; Grain
                  </h3>
                  <p className="text-xs opacity-75">Granos frescos tostados directo a tu puerta.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-xl bg-crema/40 p-4 text-sm dark:bg-cafe/30">
                <div className="flex justify-between">
                  <span className="font-medium opacity-80">Estado:</span>
                  <span
                    className={`font-bold ${
                      profile.subscriptions.coffeeClub
                        ? 'text-lima dark:text-lima'
                        : 'text-terracota dark:text-lima'
                    }`}
                  >
                    {profile.subscriptions.coffeeClub ? 'Activa' : 'Pausada / No suscrito'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium opacity-80">Plan:</span>
                  <span className="font-semibold text-cafe dark:text-crema">
                    {profile.subscriptions.coffeeClubPlan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium opacity-80">Frecuencia:</span>
                  <span className="font-semibold text-cafe dark:text-crema">
                    {profile.subscriptions.frequency}
                  </span>
                </div>
              </div>

              <button
                onClick={toggleClub}
                className="mt-5 w-full rounded-xl bg-ocre py-2.5 text-sm font-bold text-cafe hover:brightness-110 dark:bg-terracota-muted dark:text-crema"
              >
                {profile.subscriptions.coffeeClub ? 'Pausar Suscripción' : 'Activar Suscripción Mensual'}
              </button>
            </div>

            <div className="rounded-2xl border border-oliva-claro/20 bg-white/70 p-6 shadow-sm dark:bg-oliva/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oliva-claro/20 text-cafe dark:text-crema">
                  <Icon name="refresh" size={20} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-cafe dark:text-crema">
                    Boletín y Noticias
                  </h3>
                  <p className="text-xs opacity-75">Promociones, nuevos orígenes y guías de preparación.</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-crema/40 p-4 text-sm dark:bg-cafe/30">
                <div>
                  <p className="font-bold text-cafe dark:text-crema">Recibir novedades por email</p>
                  <p className="text-xs opacity-70">Enviado a {user.email}</p>
                </div>
                <button
                  onClick={toggleNewsletter}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    profile.subscriptions.newsletter
                      ? 'bg-lima text-cafe'
                      : 'bg-oliva-claro/20 text-cafe dark:text-crema'
                  }`}
                >
                  {profile.subscriptions.newsletter ? 'Activado' : 'Desactivado'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: LISTA DE FAVORITOS */}
        {activeTab === 'favoritos' && (
          <div>
            <div className="pb-4">
              <h2 className="font-display text-2xl font-bold text-cafe dark:text-crema">
                Mis productos favoritos
              </h2>
              <p className="text-sm opacity-75">
                Guarda los productos que más te gustan para comprarlos más adelante.
              </p>
            </div>

            {favorites.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white/70 p-10 text-center shadow-sm dark:bg-oliva/60">
                <Icon name="heart" size={40} className="mx-auto text-oliva-claro opacity-50" />
                <p className="mt-3 text-lg font-bold text-cafe dark:text-crema">
                  Tu lista de favoritos está vacía.
                </p>
                <p className="mt-1 text-sm opacity-70">
                  Explora el catálogo y presiona el ícono de favorito en los cafés que quieras recordar.
                </p>
                <Link
                  to="/"
                  className="mt-5 inline-block rounded-xl bg-ocre px-6 py-2.5 font-bold text-cafe hover:brightness-110 dark:bg-terracota-muted dark:text-crema"
                >
                  Explorar catálogo
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {favorites.map((p) => (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-oliva-claro/20 bg-white shadow-sm dark:bg-oliva"
                  >
                    <div className="relative aspect-square bg-crema dark:bg-cafe/40">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-bold opacity-60">
                          Sin imagen
                        </div>
                      )}
                      <button
                        onClick={() => toggleFavorite(p)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow transition hover:scale-110 dark:bg-cafe/90"
                        title="Quitar de favoritos"
                      >
                        <Icon name="heart" size={16} className="fill-terracota stroke-terracota" />
                      </button>
                    </div>
                    <div className="p-4">
                      <Link to={`/product/${p.id}`} className="font-bold text-cafe hover:underline dark:text-crema">
                        {p.name}
                      </Link>
                      <p className="text-sm font-bold text-cafe dark:text-lima">
                        {formatPrice(p.price)}
                      </p>
                      <button
                        onClick={async () => {
                          await addItem(p, 1);
                          openCart();
                        }}
                        className="mt-3 w-full rounded-xl bg-ocre py-2 text-xs font-bold text-cafe hover:brightness-110 dark:bg-terracota-muted dark:text-crema"
                      >
                        Añadir al carrito
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: AVATAR */}
        {activeTab === 'avatar' && (
          <div className="rounded-2xl border border-oliva-claro/20 bg-white/70 p-6 shadow-sm dark:bg-oliva/60">
            <h2 className="font-display text-xl font-bold text-cafe dark:text-crema">
              Elige tu avatar personalizado
            </h2>
            <p className="mt-1 text-sm opacity-75">
              Haz clic en cualquiera de las imágenes para representarte en tu perfil y barra de
              navegación.
            </p>

            <div className="mt-6 grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
              {AVATARS.map((a) => (
                <button
                  key={a.path}
                  onClick={() => {
                    setAvatar(user.id, a.path);
                    forceUpdate((n) => n + 1);
                    notify('Avatar actualizado.', 'success');
                  }}
                  className={`group relative aspect-square overflow-hidden rounded-full border-4 transition hover:scale-105 ${
                    a.url === currentAvatar
                      ? 'border-ocre ring-4 ring-ocre/40 dark:border-lima'
                      : 'border-transparent'
                  }`}
                >
                  <img src={a.url} alt="Avatar" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal / Formulario Flotante de Dirección de Envío */}
      <AnimatePresence>
        {shippingModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-oliva"
            >
              <h3 className="font-display text-xl font-bold text-cafe dark:text-crema">
                {shippingModal.editingId ? 'Editar dirección de envío' : 'Añadir dirección de envío'}
              </h3>

              <form onSubmit={handleSaveShipping} className="mt-4 space-y-3 text-sm">
                <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                  Etiqueta (Ej: Casa, Trabajo)
                  <input
                    type="text"
                    value={shippingForm.name}
                    onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                  />
                </label>

                <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                  Nombre de quien recibe
                  <input
                    type="text"
                    value={shippingForm.recipient}
                    onChange={(e) =>
                      setShippingForm({ ...shippingForm, recipient: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                  />
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <label className="col-span-2 block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                    Calle y número
                    <input
                      type="text"
                      placeholder="Av. Providencia 1234"
                      value={shippingForm.street}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, street: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                    Depto/Casa
                    <input
                      type="text"
                      placeholder="502"
                      value={shippingForm.depto}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, depto: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                    Comuna
                    <input
                      type="text"
                      placeholder="Providencia"
                      value={shippingForm.comuna}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, comuna: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                    />
                  </label>
                  <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                    Ciudad
                    <input
                      type="text"
                      value={shippingForm.city}
                      onChange={(e) =>
                        setShippingForm({ ...shippingForm, city: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                    />
                  </label>
                </div>

                <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                  Teléfono de contacto para la entrega
                  <input
                    type="tel"
                    placeholder="964819595"
                    value={shippingForm.phone}
                    onChange={(e) =>
                      setShippingForm({ ...shippingForm, phone: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                  />
                </label>

                <label className="flex items-center gap-2 pt-1 text-xs">
                  <input
                    type="checkbox"
                    checked={shippingForm.isDefault}
                    onChange={(e) =>
                      setShippingForm({ ...shippingForm, isDefault: e.target.checked })
                    }
                    className="rounded text-ocre"
                  />
                  <span>Establecer como dirección predeterminada</span>
                </label>

                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-ocre py-2.5 font-bold text-cafe hover:brightness-105 dark:bg-terracota-muted dark:text-crema"
                  >
                    Guardar dirección
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingModal({ open: false, editingId: null })}
                    className="rounded-xl border border-oliva-claro/30 px-4 py-2.5 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal / Formulario Flotante de Facturación */}
      <AnimatePresence>
        {billingModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-oliva"
            >
              <h3 className="font-display text-xl font-bold text-cafe dark:text-crema">
                {billingModal.editingId ? 'Editar datos de facturación' : 'Añadir datos de facturación'}
              </h3>

              <form onSubmit={handleSaveBilling} className="mt-4 space-y-3 text-sm">
                <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                  Razón Social o Nombre
                  <input
                    type="text"
                    value={billingForm.businessName}
                    onChange={(e) =>
                      setBillingForm({ ...billingForm, businessName: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                    required
                  />
                </label>

                <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                  RUT de Facturación
                  <input
                    type="text"
                    placeholder="76.123.456-7"
                    value={billingForm.rut}
                    onChange={(e) =>
                      setBillingForm({ ...billingForm, rut: formatRut(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                    required
                  />
                </label>

                <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                  Giro comercial
                  <input
                    type="text"
                    placeholder="Cafetería, Servicios, etc."
                    value={billingForm.giro}
                    onChange={(e) =>
                      setBillingForm({ ...billingForm, giro: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                  />
                </label>

                <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                  Dirección fiscal
                  <input
                    type="text"
                    placeholder="Av. Andrés Bello 1234"
                    value={billingForm.address}
                    onChange={(e) =>
                      setBillingForm({ ...billingForm, address: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                    Comuna
                    <input
                      type="text"
                      placeholder="Santiago"
                      value={billingForm.comuna}
                      onChange={(e) =>
                        setBillingForm({ ...billingForm, comuna: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                    />
                  </label>
                  <label className="block text-xs font-bold uppercase text-oliva-claro dark:text-crema/70">
                    Ciudad
                    <input
                      type="text"
                      value={billingForm.city}
                      onChange={(e) =>
                        setBillingForm({ ...billingForm, city: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-oliva-claro/30 bg-white px-3 py-2 text-cafe dark:bg-cafe/50 dark:text-crema"
                    />
                  </label>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-ocre py-2.5 font-bold text-cafe hover:brightness-105 dark:bg-terracota-muted dark:text-crema"
                  >
                    Guardar facturación
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingModal({ open: false, editingId: null })}
                    className="rounded-xl border border-oliva-claro/30 px-4 py-2.5 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
