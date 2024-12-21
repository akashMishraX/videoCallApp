import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

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
});
