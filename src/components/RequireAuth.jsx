import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Protege rutas. Si la sesión se cierra (incluso desde otra pestaña), redirige al login. */
export default function RequireAuth({ admin = false, children }) {
  const { enabled, ready, user, isAdmin } = useAuth();
  const location = useLocation();

  if (!enabled) return admin ? <Navigate to="/" replace /> : children;
  if (!ready) return <p className="p-10">Cargando sesión…</p>;
  if (!user) return <Navigate to="/ingresar" state={{ from: location.pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
