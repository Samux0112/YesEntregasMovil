<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import Swal from 'sweetalert2';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// Accede al router
const router = useRouter();

// Accede al store de autenticación
const authStore = useAuthStore();

// Obtén el nombre de usuario y la ruta del store correctamente
const username = computed(() => authStore.user?.Nombre || 'Invitado');
const ruta = computed(() => authStore.user?.Username || 'No existe la ruta');

// Manejo de fecha y hora actual
const fechaHoraActual = ref('');
const mensajeBienvenida = ref(''); // Aquí almacenamos el mensaje de la API
const mensajeIndicativo = ref(''); // Nueva variable para el mensaje indicativo
const clientesPendientes = ref(0); // Contador de clientes pendientes
const totalKgsGlobal = ref(0); // Peso total de todas las entregas

// Variable de estado para manejar el mute
const isMuted = ref(false);

// Leer el estado de mute desde localStorage al montar el componente
onMounted(() => {
    isMuted.value = JSON.parse(localStorage.getItem('isMuted')) || false;
});

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

// Función para obtener el mensaje de bienvenida desde la API y personalizarlo
const obtenerMensajeBienvenida = async () => {
    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/etiquetas/', {
            param: 'msg_audible_resum',
        });

        if (response.data && response.data.length > 0) {
            let mensaje = response.data[0].valor;
            // Reemplazar las variables en el mensaje
            mensaje = mensaje.replace('[Carlos]', username.value);
            mensaje = mensaje.replace('[SUP001]', ruta.value);
            mensaje = mensaje.replace('[48]', clientesPendientes.value);
            mensaje = mensaje.replace('[1800]', totalKgsGlobal.value);
            mensajeBienvenida.value = mensaje;
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

// Función para que el navegador hable un mensaje
const hablarMensaje = async (mensaje) => {
    if (isMuted.value) {
        return; // Si está en mute, no hacer nada
    }

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(mensaje);
        utterance.lang = 'es-ES'; // Configurar el idioma
        window.speechSynthesis.speak(utterance);
    } else {
        try {
            await TextToSpeech.speak({
                text: mensaje,
                lang: 'es-ES',
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0
            });
        } catch (error) {
            console.warn('Error al utilizar la síntesis de voz en la plataforma nativa:', error);
        }
    }
};

// Función para detener la síntesis de voz
const detenerHabla = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    } else {
        TextToSpeech.stop();
    }
};

// Función para cargar clientes y contar los pendientes
const cargarClientesPendientes = async () => {
    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/clientes/', {
            sortl: username.value,
        });

        if (response.data && response.data.length > 0) {
            const clientesConEstado = response.data.map(cliente => ({
                ...cliente,
                estado: cliente.estado || 'pendiente' // Asignar estado inicial como pendiente si no existe
            }));
            localStorage.setItem('clientes', JSON.stringify(clientesConEstado));
            localStorage.setItem('ultimaCargaClientes', new Date().toISOString()); // Guardar la fecha de la última carga
            clientesPendientes.value = clientesConEstado.filter(cliente => cliente.estado === 'pendiente').length;
        } else {
            clientesPendientes.value = 0;
            Swal.fire({
                title: 'Sin clientes',
                text: 'No se encontraron clientes para el usuario proporcionado.',
                icon: 'info',
                confirmButtonText: 'Entendido',
            });
        }
    } catch (error) {
        console.error('Error al cargar los clientes:', error);
        clientesPendientes.value = 0;
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al cargar los clientes.',
            icon: 'error',
            confirmButtonText: 'Entendido',
        });
    }
};

// Función para obtener el peso total de todas las entregas
const obtenerTotalKgsGlobal = async () => {
    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/entregas/', {
            bzirk: username.value
        });

        if (response.data && response.data.length > 0) {
            totalKgsGlobal.value = response.data.reduce((acc, item) => acc + item.KGS, 0).toFixed(2);
        } else {
            totalKgsGlobal.value = 0;
        }
    } catch (error) {
        console.error('Error al obtener el peso total de todas las entregas:', error);
        totalKgsGlobal.value = 0;
    }
};

// Función para redirigir a la vista de entregas
const handleEntrega = () => {
    authStore.registrarAccion('Iniciar entregas');
    router.push('/clientes'); // Redirige a la ruta de entregas
};

// Actualizar la fecha y hora cada segundo
onMounted(async () => {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Solicitar permisos de geolocalización
    await authStore.requestLocationPermissions();

    // Cargar clientes pendientes
    await cargarClientesPendientes();

    // Obtener el peso total de todas las entregas
    await obtenerTotalKgsGlobal();

    // Obtener el mensaje de bienvenida e indicativo al montar el componente
    await obtenerMensajeBienvenida();
    await obtenerMensajeIndicativo();

    // Concatenar y hablar ambos mensajes
    const mensajeCompleto = `${mensajeBienvenida.value}. ${mensajeIndicativo.value}`;
    hablarMensaje(mensajeCompleto);
});

// Observar cambios en isMuted para detener el habla instantáneamente
watch(isMuted, (newVal) => {
    if (newVal) {
        detenerHabla();
    }
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
            <br>
            <!-- Fecha y hora -->
            <p class="text-xl mt-8">
                <span class="text-secondary font-semibold">{{ fechaHoraActual }}</span>
            </p>
            <br>
        </div>
    </div>
</template>