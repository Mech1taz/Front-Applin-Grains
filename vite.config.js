import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// El front solo habla con el BFF. En desarrollo, Vite reenvía /api -> BFF
// (así no hay problemas de CORS). El destino se configura en .env (BFF_URL).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.BFF_URL || 'http://localhost:8088', changeOrigin: true },
      },
    },
  };
});
