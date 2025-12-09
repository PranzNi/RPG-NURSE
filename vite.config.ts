import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: './', // Important for GitHub Pages relative pathing
    define: {
      // Safely inject these specific variables during the build process
      // This allows the GitHub Action secrets to be "baked" into the code
      'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
      // Fallback for other process.env calls, but primarily we rely on the above
      'process.env': {} 
    }
  };
});
