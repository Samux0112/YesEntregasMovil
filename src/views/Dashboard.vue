<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

// Accede al router
const router = useRouter();

// Accede al store de autenticación
const authStore = useAuthStore();

// Carga la sesión al iniciar el componente
onMounted(() => {
    authStore.loadSession();
    // Solicitar la ubicación y enviar el log al cargar el dashboard
    obtenerUbicacionYEnviarLog();
    setInterval(obtenerUbicacionYEnviarLog, 60000); // Actualizar cada 60 segundos
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
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/etiquetas/', {
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
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/etiquetas/', {
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

// Función para obtener la ubicación del usuario y enviar el log
const obtenerUbicacionYEnviarLog = async () => {
    try {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    authStore.location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    console.log('Ubicación obtenida:', authStore.location);

                    // Crear log con datos de geolocalización y usuario
                    const logData = {
                        json_accion: {
                            'fecha-hora': new Date().toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            }),
                            'Accion': 'Login',
                            'Username': authStore.user?.Username || 'No disponible',
                            'latitud': authStore.location.latitude.toString(),
                            'longitud': authStore.location.longitude.toString(),
                        }
                    };

                    // Obtener el token del almacenamiento local antes de enviar la solicitud
                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/logs/', logData, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            if (response.status === 200 || response.status === 201) {
                                console.log('Log enviado correctamente.');
                            } else {
                                console.error('Error al enviar el log:', response);
                            }
                        } catch (error) {
                            console.error('Error al enviar el log:', error);
                        }
                    } else {
                        console.error('Token no encontrado en el almacenamiento local.');
                    }
                },
                (error) => {
                    console.error('Error al obtener la ubicación:', error.message);
                }
            );
        }
    } catch (error) {
        console.error('Error al obtener la ubicación y enviar el log:', error);
    }
};

// Función para redirigir a la vista de entregas
const handleEntrega = () => {
    router.push('/clientes'); // Redirige a la ruta de entregas
};

// Actualizar la fecha y hora cada segundo
onMounted(() => {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Obtener el mensaje de bienvenida e indicativo al montar el componente
    obtenerMensajeBienvenida();
    obtenerMensajeIndicativo();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 text-center">
            <!-- Mensaje de bienvenida -->
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
            <!-- Mensaje indicativo -->
            <p class="text-xl mt-4">
                {{ mensajeIndicativo || 'Cargando mensaje indicativo...' }}
            </p>
            <br>
            <!-- Botón de inicio de día -->
            <Button label="Iniciar entregas" class="w-auto p-2 text-sm" @click="handleEntrega"></Button>
            <br><br>

            <!-- Ubicación -->
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

            <!-- Fecha y hora -->
            <p class="text-xl mt-8">
                <span class="text-secondary font-semibold">{{ fechaHoraActual }}</span>
            </p>
        </div>
    </div>
</template>