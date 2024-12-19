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
    
});
