import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
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
        proxy: {
            '/export': {
                target: 'https://export.highcharts.com',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/export/, '')
            }
        }
    }

    // server: {
    //       host: '0.0.0.0', // Esto hace que el servidor sea accesible desde cualquier dispositivo en la misma red
    //       port: 3000, // O cualquier puerto que prefieras
    //     }
});