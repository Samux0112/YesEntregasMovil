<script setup>
import { useAuthStore } from '@/api/authStores';
import { onMounted } from 'vue';

const authStore = useAuthStore();

onMounted(() => {
    console.log('Cargando sesión desde App.vue');
    authStore.loadSession();
});
</script>

<template>
    <router-view />
</template>
