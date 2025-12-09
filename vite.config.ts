import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for GitHub Pages relative pathing
  define: {
    // Polyfill process.env for the services that use it
    'process.env': process.env
  }
});