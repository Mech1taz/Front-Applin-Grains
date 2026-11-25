import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../hooks/useTheme.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

const NAV = [
  { to: '/admin', label: 'Pedidos y stock', icon: 'orders' },
  { to: '/reports', label: 'Reportes', icon: 'chart' },
  { to: '/audit', label: 'Auditoría', icon: 'audit' },
];

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-lima text-cafe shadow-sm'
      : 'text-cafe/70 hover:bg-oliva-claro/15 dark:text-crema/70 dark:hover:bg-crema/10'
  }`;

/** Shell del panel Admin: sidebar + barra superior. Las rutas hijas se pintan en <Outlet />. */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen p-0 lg:p-5">
      {/* Fondo plano igual que la tienda (crema / café); las tarjetas blancas (u oliva en oscuro) resaltan encima */}
      <div className="mx-auto flex min-h-screen max-w-[1400px] overflow-hidden border border-oliva-claro/20 bg-crema shadow-xl dark:border-crema/10 dark:bg-cafe lg:min-h-[calc(100vh-2.5rem)] lg:rounded-[2rem]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-oliva-claro/20 bg-white dark:bg-oliva/40 lg:flex">
          <Link to="/" className="flex items-center gap-3 px-6 py-6">
            <img src="/logo.png" alt="" className="h-9 w-9 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="font-display text-xl font-bold text-cafe dark:text-crema">Applin &amp; Grain</span>
          </Link>
          <nav className="flex-1 space-y-1 px-4" aria-label="Administración">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkCls}><Icon name={n.icon} />{n.label}</NavLink>
            ))}
          </nav>
          <div className="m-4 rounded-2xl bg-ocre/25 p-4 text-center text-xs text-cafe dark:bg-ocre/15 dark:text-crema">
            <p className="font-bold">¿Algo no cuadra?</p>
            <p className="mt-1 opacity-80">Revisa la auditoría de cada pedido.</p>
            <Link to="/audit" className="mt-3 block rounded-lg bg-white py-2 font-bold text-cafe dark:bg-crema">Ir a auditoría</Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-3 px-5 py-4 lg:px-8 lg:py-6">
            <div className="mr-auto">
              <h1 className="font-display text-2xl font-bold text-cafe dark:text-crema">Panel de administración</h1>
              <p className="text-sm">Hola, {user?.name?.split(' ')[0] ?? 'admin'}. Esto es lo que pasa hoy.</p>
            </div>
            <Link to="/" className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm shadow-sm dark:bg-oliva"><Icon name="store" size={16} />Tienda</Link>
            <button onClick={toggle} aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} className="rounded-full bg-white p-2.5 shadow-sm dark:bg-oliva"><Icon name={dark ? 'sun' : 'moon'} size={18} /></button>
            <button onClick={logout} aria-label="Cerrar sesión" className="rounded-full bg-white p-2.5 shadow-sm dark:bg-oliva"><Icon name="logout" size={18} /></button>
            {user && <Avatar user={user} size={38} />}
          </header>
          <nav className="flex gap-2 overflow-x-auto px-5 pb-3 lg:hidden" aria-label="Administración">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} className={linkCls}>{n.label}</NavLink>)}
          </nav>
          <main className="px-5 pb-8 lg:px-8"><Outlet /></main>
        </div>
      </div>
    </div>
  );
}