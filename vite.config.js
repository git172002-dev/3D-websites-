import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // Do not inline assets to ensure clean path handling
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mib: resolve(__dirname, 'MIB/index.html'),
        burger: resolve(__dirname, 'burger/index.html'),
        pizza: resolve(__dirname, 'pizza/index.html')
      }
    }
  }
});
