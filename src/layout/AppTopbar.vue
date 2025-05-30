<script setup>
import { useAuthStore } from '@/api-plugins/authStores.js'; // Importa el store de autenticación
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue'; // Importa ref, onMounted y computed para manejar el estado reactivo
import AppConfigurator from './AppConfigurator.vue';

const authStore = useAuthStore(); // Instanciamos el store de autenticación
const { toggleMenu, toggleDarkMode, isDarkTheme, defaultSwal } = useLayout();

// Leer el estado de mute desde el store
const isMuted = computed(() => authStore.isMuted);

// Computed para nombre y ruta
const username = computed(() => authStore.user?.Nombre || "Invitado");
const ruta = computed(() => authStore.user?.Username || "Sin ruta");

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
                <span class="font-bold text-xs">Yes entregas</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <!-- Mostrar nombre y ruta del usuario con estilo -->
            <div class="layout-topbar-user flex items-center space-x-2" v-if="authStore.user">
                <span class="text-secondary text-xs">Ruta: {{ ruta }}</span>
            </div>
            <div class="layout-config-menu">
                <AppConfigurator />
                <div class="relative">
                    <button type="button" class="layout-topbar-action btn btn-danger" @click="handleLogout">
                        <i class="pi pi-power-off"></i>
                        <span class="ml-2">Cerrar Sesión</span>
                    </button>
                    <button type="button" class="layout-topbar-action btn btn-secondary" @click="authStore.toggleMute">
                        <i class="pi" :class="isMuted ? 'pi-volume-off' : 'pi-volume-up'"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>