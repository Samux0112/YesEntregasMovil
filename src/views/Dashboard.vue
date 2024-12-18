<script setup>
import { useAuthStore } from '@/views/pages/auth/js/authStores';
import { computed, onMounted, ref } from 'vue';

// Accede al store de autenticación
const authStore = useAuthStore();

// Carga la sesión al iniciar el componente
onMounted(() => {
    authStore.loadSession();
});

// Obtén el nombre de usuario del store correctamente
const username = computed(() => authStore.user?.Nombre || 'Invitado');
const ruta = computed(() => authStore.user?.Username || 'No existe la ruta');

// Manejo de fecha y hora actual
const fechaHoraActual = ref('');

const actualizarFechaHora = () => {
    const now = new Date();
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // Habilitar el formato de 12 horas con AM/PM
    };
    fechaHoraActual.value = now.toLocaleString('es-ES', opciones);
};

// Actualizar la fecha y hora cada segundo
onMounted(() => {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 text-center">
            <h1 class="text-3xl font-bold">
                Bienvenido al sistema de entregas
            </h1>
            <br>
            <p class="text-xl mt-4">
                Usuario: <span class="text-primary font-semibold">{{ username }}</span>
            </p>
            <p class="text-xl mt-4">
                Ruta: <span class="text-primary font-semibold">{{ ruta }}</span>
            </p>
            <br>
            <p>Para iniciar da click en el botón de iniciar entrega</p>
            <br>
            <!-- Botón de inicio de dia -->
            <Button label="Iniciar entregas" class="w-auto p-2 text-sm" @click="handleInicio"></Button>
            <!-- Mostrar fecha y hora con AM/PM -->
            <p class="text-xl mt-8">
            <span class="text-secondary font-semibold">{{ fechaHoraActual }}</span>
            </p>
        </div>
    </div>
</template>
