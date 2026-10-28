import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { InteractionRequiredAuthError, PublicClientApplication } from '@azure/msal-browser';
import { setTokenProvider } from '../services/http.js';
import { useToast } from './ToastContext.jsx';

const env = import.meta.env;
const ENABLED = env.VITE_AUTH_ENABLED === 'true';
const API_SCOPES = [env.VITE_API_SCOPE].filter(Boolean);
const LOGIN_SCOPES = ['openid', 'profile', 'email', ...API_SCOPES];
const ADMIN_ROLE = env.VITE_ADMIN_ROLE || 'Admin';
// Solo para la interfaz mientras no exista el rol en Azure. La seguridad real la aplica el BFF.
const ADMIN_EMAILS = (env.VITE_ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
const MSA_TENANT = '9188040d-6c67-4c5b-b112-36a304b66dad'; // tenant de cuentas personales Microsoft

// localStorage: la sesión se comparte entre pestañas del mismo navegador
const msal = ENABLED
  ? new PublicClientApplication({
      auth: {
        clientId: env.VITE_ENTRA_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${env.VITE_ENTRA_AUTHORITY || 'common'}`,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'localStorage' },
    })
  : null;

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('applin-auth') : null;

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const { notify } = useToast();
  const [account, setAccount] = useState(null);
  const [ready, setReady] = useState(!ENABLED);

  const syncFromCache = useCallback(() => {
    const acc = msal.getAllAccounts()[0] ?? null;
    if (acc) msal.setActiveAccount(acc);
    setAccount(acc);
  }, []);

  useEffect(() => {
    if (!msal) return undefined;
    let cleanup = () => {};
    msal.initialize()
      .then(() => msal.handleRedirectPromise())
      .then(() => {
        syncFromCache();
        // Cierre/inicio de sesión en otra pestaña: aviso directo + respaldo por cambios del caché de MSAL
        const onMsg = (e) => (e.data === 'logout' ? setAccount(null) : syncFromCache());
        channel?.addEventListener('message', onMsg);
        window.addEventListener('storage', syncFromCache);
        cleanup = () => {
          channel?.removeEventListener('message', onMsg);
          window.removeEventListener('storage', syncFromCache);
        };
      })
      .finally(() => setReady(true));
    return () => cleanup();
  }, [syncFromCache]);

  const login = useCallback(async () => {
    try {
      const res = await msal.loginPopup({ scopes: LOGIN_SCOPES, prompt: 'select_account' });
      msal.setActiveAccount(res.account);
      setAccount(res.account);
      channel?.postMessage('login');
      return true;
    } catch (e) {
      if (e.errorCode !== 'user_cancelled') notify('No pudimos iniciar sesión. Inténtalo de nuevo.', 'error');
      return false;
    }
  }, [notify]);

  const logout = useCallback(async () => {
    try {
      await msal.logoutPopup({ account, mainWindowRedirectUri: window.location.origin });
    } catch { /* el usuario cerró la ventana */ }
    if (msal.getAllAccounts().length === 0) {
      setAccount(null);
      channel?.postMessage('logout');
    }
  }, [account]);

  const getToken = useCallback(async () => {
    if (!msal || !account || API_SCOPES.length === 0) return null;
    try {
      return (await msal.acquireTokenSilent({ scopes: API_SCOPES, account })).accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        return (await msal.acquireTokenPopup({ scopes: API_SCOPES, account })).accessToken;
      }
      throw e;
    }
  }, [account]);

  useEffect(() => { setTokenProvider(getToken); }, [getToken]);

  const value = useMemo(() => {
    const roles = account?.idTokenClaims?.roles ?? [];
    const email = account?.username ?? '';
    return {
      enabled: ENABLED,
      ready,
      user: account
        ? {
            name: account.name || email,
            email,
            id: account.localAccountId,
            kind: account.tenantId === MSA_TENANT ? 'Cuenta personal Microsoft' : 'Cuenta organizacional',
          }
        : null,
      isAdmin: roles.includes(ADMIN_ROLE) || ADMIN_EMAILS.includes(email.toLowerCase()),
      login,
      logout,
    };
  }, [account, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
