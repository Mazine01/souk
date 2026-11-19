import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development the API runs on :4000; proxying keeps cookies same-site.
    proxy: { '/api': 'http://localhost:4000' },
  },
});
