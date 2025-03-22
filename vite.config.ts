import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isSSR = process.env.BUILD_SSR === 'true';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  ssr: {
    noExternal: ['react-router-dom', 'react-helmet-async']
  },
  build: {
    ssr: 'ssr-entry.ts',
    sourcemap: true,
    ...(isSSR
      ? {} // no manualChunks during SSR
      : {
          rollupOptions: {
            output: {
              manualChunks: {
                'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                'supabase': ['@supabase/supabase-js']
              }
            }
          }
        })
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://sky-scanner3.p.rapidapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          'X-RapidAPI-Key': 'eff37b01a1msh6090de6dea39514p108435jsnf7c09e43a0a5',
          'X-RapidAPI-Host': 'sky-scanner3.p.rapidapi.com',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        }
      }
    }
  }
});
