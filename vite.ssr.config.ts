// vite.ssr.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: ['react-router-dom', 'react-helmet-async']
  },
  build: {
    ssr: 'ssr-entry.ts',
    sourcemap: true
    // ❌ No manualChunks here!
  }
});
