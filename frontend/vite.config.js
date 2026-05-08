import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  server: {
    host: true,        // otomatis 0.0.0.0 → bisa diakses LAN
    port: 5173,        // port default
    strictPort: false, // kalau port 5173 dipakai, auto cari port lain
  }
});
