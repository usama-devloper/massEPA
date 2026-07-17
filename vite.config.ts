import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],  // No tailwind plugin needed for v3
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      open: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        usePolling: true,
      },
    },
    build: {
      // Windows may lock Thumbs.db in dist; overwrite assets without clearing the folder.
      emptyOutDir: false,
    },
  };
});