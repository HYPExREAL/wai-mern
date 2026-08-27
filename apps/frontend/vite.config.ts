import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'map';
            }
            if (id.includes('lucide-react')) {
              return 'ui';
            }
            if (id.includes('@tensorflow') || id.includes('@teachablemachine')) {
              return 'ai';
            }
            if (id.includes('axios')) {
              return 'utils';
            }
            return 'deps'; // Catch-all for other dependencies
          }
        },
      },
    },
  },
});