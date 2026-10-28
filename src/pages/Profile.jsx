import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { AVATARS, getAvatar, setAvatar } from '../utils/avatars.js';

const pill = 'rounded-full bg-oliva-claro/20 px-3 py-1 text-xs font-bold text-cafe dark:text-crema';

export default function Profile() {
  const { user, isAdmin, logout } = useAuth();
  const [, force] = useState(0);
  if (!user) return null;
  const current = getAvatar(user.id);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-white p-8 text-center shadow-md dark:bg-oliva sm:flex-row sm:text-left">
        <Avatar user={user} size={112} />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-cafe dark:text-crema">{user.name}</h1>
          <p className="mt-1">{user.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className={pill}>{user.kind}</span>
            <span className={pill}>{isAdmin ? 'Administrador' : 'Cliente'}</span>
          </div>
        </div>
        <button onClick={logout} className="rounded-full bg-oliva-claro/15 px-5 py-2 text-sm font-medium text-cafe hover:bg-oliva-claro/30 dark:text-crema">
          Cerrar sesión
        </button>
      </div>

      {AVATARS.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold text-cafe dark:text-crema">Elige tu avatar</h2>
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {AVATARS.map((a) => (
              <button
                key={a.path} aria-label="Elegir este gato" aria-pressed={a.url === current}
                onClick={() => { setAvatar(user.id, a.path); force((n) => n + 1); }}
                className={`overflow-hidden rounded-full border-4 transition hover:scale-105 ${a.url === current ? 'border-ocre' : 'border-transparent'}`}
              >
                <img src={a.url} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
