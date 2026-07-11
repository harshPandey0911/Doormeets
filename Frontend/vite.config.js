import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    // Ensure only one React instance
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173, // Change port to bypass cache
    strictPort: true,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: http: https: http://localhost:* http://127.0.0.1:* http://localhost:5000 http://127.0.0.1:5000; font-src 'self' data: https:; connect-src 'self' https: ws: wss: http://localhost:* http://127.0.0.1:* http://localhost:5000 http://127.0.0.1:5000; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; media-src 'self' https: blob: data:;",
      // Force no caching in development
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core — cached across all pages
            if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Firebase — only needed when push notifications or auth is used
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Maps — only needed on map/tracking pages
            if (id.includes('leaflet') || id.includes('react-leaflet') || id.includes('@react-google-maps')) {
              return 'vendor-maps';
            }
            // Charts — only needed on dashboard/reports pages
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // Animation libraries
            if (id.includes('framer-motion') || id.includes('gsap')) {
              return 'vendor-animation';
            }
            // UI utilities
            if (id.includes('swiper') || id.includes('react-icons') || id.includes('date-fns') || id.includes('react-dropzone') || id.includes('react-hot-toast')) {
              return 'vendor-ui';
            }
            // Everything else (axios, socket.io-client, zod, etc.)
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase limit since we have multiple vendor chunks now
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
  optimizeDeps: {
    include: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
    ],
  },
});
