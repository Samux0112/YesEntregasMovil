import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    // Define the base path for your app
    base: '/', // Ajuste aquí para la carpeta 'lactolac' si es necesario

    optimizeDeps: {
        noDiscovery: true
    },

    plugins: [
        vue(),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },

    server: {
        host: '172.16.2.235', // Esto hace que el servidor escuche en todas las interfaces de red
        port: 3000, 
        open: true, 
        proxy: {
            '/api': {
                target: 'https://ad-auth.yes.com.sv', // URL del servidor API
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '') 
            }
        }
    }
});
