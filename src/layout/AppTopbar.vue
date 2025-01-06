<script setup>
import { ref, onMounted, watch } from 'vue'; // Importa ref, onMounted y watch para manejar el estado reactivo
import { useAuthStore } from '@/api-plugins/authStores.js'; // Importa el store de autenticación
import { useLayout } from '@/layout/composables/layout';
import AppConfigurator from './AppConfigurator.vue';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const authStore = useAuthStore(); // Instanciamos el store de autenticación
const { toggleMenu, toggleDarkMode, isDarkTheme, defaultSwal } = useLayout();

// Variable de estado para manejar el mute
const isMuted = ref(false);

// Leer el estado de mute desde localStorage al montar el componente
onMounted(() => {
    isMuted.value = JSON.parse(localStorage.getItem('isMuted')) || false;
});

// Función para alternar el estado de mute
const toggleMute = () => {
    isMuted.value = !isMuted.value;
    localStorage.setItem('isMuted', JSON.stringify(isMuted.value)); // Guardar el estado de mute en localStorage
};

// Función para detener la síntesis de voz
const detenerHabla = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    } else {
        TextToSpeech.stop();
    }
};

// Observar cambios en isMuted para detener el habla instantáneamente
watch(isMuted, (newVal) => {
    if (newVal) {
        detenerHabla();
    }
});

// Lógica para manejar el logout
const handleLogout = () => {
    authStore.logout(); // Llama a la acción logout del store
};
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/dashboard" class="layout-topbar-logo">
                <span>Yes entregas</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <AppConfigurator />
                <div class="relative">
                    <button type="button" class="layout-topbar-action btn btn-danger" @click="handleLogout">
                        <i class="pi pi-power-off"></i>
                        <span class="ml-2">Cerrar Sesión</span>
                    </button>
                    <button type="button" class="layout-topbar-action btn btn-secondary" @click="toggleMute">
                        <i class="pi" :class="isMuted ? 'pi-volume-off' : 'pi-volume-up'"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>