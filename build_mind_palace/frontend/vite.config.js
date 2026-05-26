import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:5000';
  const apiProxy = {
    target: backendTarget,
    changeOrigin: true,
  };
  const proxiedRoutes = [
    '/auth',
    '/spaces',
    '/locations',
    '/content',
    '/progress',
    '/stock-images',
    '/admin',
    '/sync',
    '/uploads',
    '/health',
  ];

  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      proxy: Object.fromEntries(proxiedRoutes.map((route) => [route, apiProxy])),
    },
    preview: {
      port: 3000,
      strictPort: true,
    },
  };
});
