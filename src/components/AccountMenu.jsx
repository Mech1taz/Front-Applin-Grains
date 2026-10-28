import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function AccountMenu() {
  const { enabled, ready, user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!enabled || !ready) return null;
  const item = 'block w-full px-4 py-2 text-left text-sm hover:bg-oliva-claro/15';

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Cuenta" aria-expanded={open} className="rounded-full p-1.5 transition hover:bg-oliva-claro/15">
        {user ? (
          <Avatar user={user} size={30} />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-cafe dark:text-crema">
            <circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18.5c1.5-2.5 9.5-2.5 11 0" />
          </svg>
        )}
      </button>
      {open && (
        <div onClick={() => setOpen(false)} className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl bg-white py-1 text-cafe shadow-xl dark:bg-oliva dark:text-crema">
          {user ? (
            <>
              <div className="border-b border-oliva-claro/20 px-4 py-2">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="truncate text-xs opacity-70">{user.email}</p>
              </div>
              <Link to="/perfil" className={item}>Mi perfil</Link>
              <Link to="/mis-pedidos" className={item}>Mis pedidos</Link>
              {isAdmin && <Link to="/admin" className={item}>Panel de administración</Link>}
              <button onClick={logout} className={item}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/ingresar" className={item}>Ingresar</Link>
              <a href="https://signup.live.com/" target="_blank" rel="noreferrer" className={item}>Crear cuenta</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
