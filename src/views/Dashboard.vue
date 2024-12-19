<script setup>
import { useAuthStore } from '@/api/authStores';
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';

// Accede al store de autenticación
const authStore = useAuthStore();

// Carga la sesión al iniciar el componente
onMounted(() => {
    authStore.loadSession();
});

// Obtén el nombre de usuario y la ruta del store correctamente
const username = computed(() => authStore.user?.Nombre || 'Invitado');
const ruta = computed(() => authStore.user?.Username || 'No existe la ruta');

// Manejo de fecha y hora actual
const fechaHoraActual = ref('');
const mensajeBienvenida = ref(''); // Aquí almacenamos el mensaje de la API
const mensajeIndicativo = ref(''); // Nueva variable para el mensaje indicativo

// Función para actualizar la fecha y hora cada segundo
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

// Función para obtener el mensaje de bienvenida desde la API
const obtenerMensajeBienvenida = async () => {
    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/etiquetas', {
            param: 'msg_bienvenida',
        });

        if (response.data && response.data.length > 0) {
            mensajeBienvenida.value = response.data[0].valor;
        } else {
            mensajeBienvenida.value = 'Mensaje no encontrado';
        }
    } catch (error) {
        console.error('Error al obtener el mensaje:', error);
        mensajeBienvenida.value = 'Error al cargar el mensaje de bienvenida';
    }
};

// Función para obtener el mensaje indicativo desde la API
const obtenerMensajeIndicativo = async () => {
    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/etiquetas', {
            param: 'msg_info',
        });

        if (response.data && response.data.length > 0) {
            mensajeIndicativo.value = response.data[0].valor;
        } else {
            mensajeIndicativo.value = 'Mensaje no encontrado';
        }
    } catch (error) {
        console.error('Error al obtener el mensaje indicativo:', error);
        mensajeIndicativo.value = 'Error al cargar el mensaje indicativo';
    }
};

// Función para obtener la ubicación del usuario
const obtenerUbicacion = async () => {
    try {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    authStore.location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    console.log('Ubicación obtenida:', authStore.location);
                },
                (error) => {
                    console.error('Error al obtener la ubicación:', error.message);
                    Swal.fire({
                        title: 'Acceso a la ubicación',
                        text: 'Se requiere acceso a la ubicación para esta aplicación.',
                        icon: 'warning',
                        confirmButtonText: 'Entendido'
                    });
                }
            );
        } else {
            Swal.fire({
                title: 'Geolocalización no soportada',
                text: 'Tu dispositivo no soporta geolocalización.',
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        }
    } catch (error) {
        console.error('Error al obtener la ubicación:', error);
    }
};

// Actualizar la fecha y hora cada segundo
onMounted(() => {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Obtener el mensaje de bienvenida e indicativo al montar el componente
    obtenerMensajeBienvenida();
    obtenerMensajeIndicativo();

    // Solicitar la ubicación al cargar el dashboard
    obtenerUbicacion();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 text-center">
            <!-- Usamos el mensaje recibido de la API -->
            <h1 class="text-3xl font-bold">
                {{ mensajeBienvenida || 'Cargando mensaje...' }}
            </h1>
            <br>
            <p class="text-xl mt-4">
                Usuario: <span class="text-primary font-semibold">{{ username }}</span>
            </p>
            <p class="text-xl mt-4">
                Ruta: <span class="text-primary font-semibold">{{ ruta }}</span>
            </p>
            <br>
            <!-- Mostrar el mensaje indicativo -->
            <p class="text-xl mt-4">
                {{ mensajeIndicativo || 'Cargando mensaje indicativo...' }}
            </p>
            <br>
            <!-- Botón de inicio de día -->
            <Button label="Iniciar entregas" class="w-auto p-2 text-sm" @click="handleInicio"></Button>
            <br><br>

            <!-- Mostrar la ubicación si está disponible -->
            <div v-if="authStore.location">
                <p class="text-xl mt-4">
                    Ubicación obtenida:
                </p>
                <p class="text-xl mt-2">
                    Latitud: <span class="text-primary font-semibold">{{ authStore.location.latitude }}</span>
                </p>
                <p class="text-xl mt-2">
                    Longitud: <span class="text-primary font-semibold">{{ authStore.location.longitude }}</span>
                </p>
            </div>
            <div v-else>
                <p class="text-xl mt-4 text-red-500">
                    No se pudo obtener la ubicación.
                </p>
            </div>

            <!-- Mostrar fecha y hora con AM/PM -->
            <p class="text-xl mt-8">
                <span class="text-secondary font-semibold">{{ fechaHoraActual }}</span>
            </p>
        </div>
    </div>
</template>

