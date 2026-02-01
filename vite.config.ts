import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const port = Number(process.env.PORT) || 4173;

  return {
    plugins: [react()],

    // ✅ Dev server (local)
    server: {
      host: '0.0.0.0',
      port: port
    },

    // ✅ CRITICAL — Railway uses preview for production
    preview: {
      host: '0.0.0.0',

      // DO NOT hardcode ports
      port: port,

      // ⭐ Fixes "Blocked request. This host is not allowed."
      allowedHosts: 'all'
    },

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
