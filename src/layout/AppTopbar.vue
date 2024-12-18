<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/views/pages/auth/js/authStores.js'; // Importa el store de autenticación
import AppConfigurator from './AppConfigurator.vue';

const authStore = useAuthStore(); // Instanciamos el store de autenticación
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();

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
            <router-link to="/" class="layout-topbar-logo">
                <span>Yes entregas</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button>

                    <AppConfigurator />
                </div>
                <div class="relative">
                    <button type="button" class="layout-topbar-action btn btn-danger" @click="handleLogout">
                        <i class="pi pi-power-off"></i>
                        <span class="ml-2">Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>
        </div>
    </div>
</template>
