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
        host: '172.16.3.200', // Esto hace que el servidor escuche en todas las interfaces de red
        port: 3000, // Puedes cambiar el puerto si es necesario
        open: true, // Esto abrirá automáticamente el navegador
        proxy: {
            '/api': {
                target: 'https://ad-auth.yes.com.sv', // URL del servidor API
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '') // Elimina el prefijo '/api'
            }
        }
    }
});
