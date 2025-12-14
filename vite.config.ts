import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(() => {
  // const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'DiggiClass',
          short_name: 'DiggiClass',
          description: 'AI-Powered Topic Review & Practice',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ],
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait'
        }
      })
    ],
    server: {
      port: 3000,
    },
  };
});