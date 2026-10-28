import axios from 'axios';

/** Error normalizado: el resto de la app nunca toca el error crudo de axios. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  get isInvalidStock() {
    return `${this.code ?? ''} ${this.message}`.toLowerCase().includes('stock');
  }
}

// El AuthContext registra aquí cómo obtener el token (Microsoft Entra).
let tokenProvider = null;
export const setTokenProvider = (fn) => { tokenProvider = fn; };

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
});

http.interceptors.request.use(async (config) => {
  const token = tokenProvider ? await tokenProvider() : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const data = err.response?.data;
    // El BFF responde { error: "..." }; Spring responde { message: "..." }
    let message = typeof data === 'object' ? data?.message || data?.error : null;
    if (status === 401) message = 'Tu sesión expiró. Vuelve a iniciar sesión.';
    else if (status === 403) message = 'No tienes permiso para realizar esta acción.';
    else if (!message) {
      message = err.code === 'ECONNABORTED'
        ? 'El servidor tardó demasiado en responder.'
        : err.response ? 'Ocurrió un error en el servidor.' : 'No pudimos conectar con el servidor.';
    }
    return Promise.reject(new ApiError(message, { status, code: data?.code ?? null }));
  }
);
