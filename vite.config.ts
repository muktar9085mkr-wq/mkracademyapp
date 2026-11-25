import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    root: import.meta.dirname,
    base: '/',
    publicDir: 'public',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 30,
              },
              {
                name: 'firebase-core',
                test: /node_modules[\\/](@?firebase)[\\/](app|installations|analytics|storage|util|component|logger)[\\/]/,
                priority: 25,
              },
              {
                name: 'firebase-auth',
                test: /node_modules[\\/](@?firebase)[\\/]auth[\\/]/,
                priority: 25,
              },
              {
                name: 'firebase-firestore',
                test: /node_modules[\\/](@?firebase)[\\/]firestore[\\/]/,
                priority: 25,
              },
              {
                name: 'motion-vendor',
                test: /node_modules[\\/](motion|framer-motion)[\\/]/,
                priority: 20,
              },
              {
                name: 'icons-vendor',
                test: /node_modules[\\/]lucide-react[\\/]/,
                priority: 20,
              },
              {
                name: 'zip-vendor',
                test: /node_modules[\\/]jszip[\\/]/,
                priority: 20,
              },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
