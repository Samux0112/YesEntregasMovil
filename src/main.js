import { createPinia } from 'pinia'; // Importar Pinia
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// PrimeVue y estilos
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import '@/api-plugins/limpiarLocal'; // Importa tu store de autenticación

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

// Importar Highcharts y HighchartsVue
import * as Highcharts from 'highcharts'; // Importa Highcharts aquí
import * as HighchartsVue from 'highcharts-vue'; // Importa HighchartsVue aquí
import * as Exporting from 'highcharts/modules/exporting';
import * as ExportData from 'highcharts/modules/export-data';
import * as Accessibility from 'highcharts/modules/accessibility';

const app = createApp(App);

// Crear Pinia
const pinia = createPinia();

// Plugins y configuraciones
app.use(router);
app.use(pinia); // Usar Pinia
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.use(HighchartsVue);
app.use(Highcharts);

app.mount('#app');