import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Basic PWA',
        short_name: 'BasicPWA',
        description: 'A basic starter PWA with Vue 3 and Vite',
        theme_color: '#ffffff',
      },
    }),
  ],
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'private-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certificate.pem'))
    }
  },
});
