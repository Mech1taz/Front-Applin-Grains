import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { enabled, ready, user, login } = useAuth();
  const from = useLocation().state?.from ?? '/';

  if (!enabled) return <Navigate to="/" replace />;
  if (ready && user) return <Navigate to={from} replace />;

  const card = 'rounded-3xl bg-white p-8 text-center shadow-md dark:bg-oliva';
  const cta = 'mt-6 inline-block rounded-full bg-ocre px-8 py-3 font-bold text-cafe transition hover:brightness-110 dark:bg-terracota-muted dark:text-crema';

  return (
    <section className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center">
      <div className={card}>
        <p className="text-sm tracking-widest">INGRESA A</p>
        <h1 className="font-display text-3xl font-bold text-cafe dark:text-crema">Applin &amp; Grain</h1>
        <p className="mx-auto mt-4 max-w-xs text-sm">
          Usa tu cuenta Microsoft (Outlook, Hotmail, Live) o la de tu organización. Si tu cuenta tiene verificación en dos pasos
          con Microsoft Authenticator, Microsoft te la pedirá.
        </p>
        <button onClick={login} className={cta}>Continuar con Microsoft</button>
      </div>
      <div className="px-4 text-center">
        <h2 className="font-display text-2xl font-bold tracking-wide text-cafe dark:text-crema">¿ERES NUEVO?</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm">Crea una cuenta Microsoft gratis y vuelve para comprar y seguir tus pedidos.</p>
        <a href="https://signup.live.com/" target="_blank" rel="noreferrer" className={cta}>Crear cuenta</a>
      </div>
    </section>
  );
}
