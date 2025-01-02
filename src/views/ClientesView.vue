<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import Swal from 'sweetalert2';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const router = useRouter();
const options = ref(['list', 'grid']);
const layout = ref('grid'); // Inicializa en 'grid'
const searchTerm = ref('');
const clientesFiltrados = ref([]);
const authStore = useAuthStore();
const username = computed(() => authStore.user?.Username || 'Invitado');
const clientes = ref([]);
const estadoFiltro = ref('Pendiente'); // Estado del filtro, inicializado en 'Pendiente'

// Estado para el submenú
const showSubmenu = ref(false);
const submenuCliente = ref(null);
const submenuOptions = [
    { label: 'Tomar Georreferencia', value: 'georreferencia' },
    { label: 'Graficar Ruta', value: 'ruta' },
    { label: 'Formulario de Encuestas', value: 'encuesta' },
    { label: 'Llamada Telefónica', value: 'llamada' }
];

// Variables para geolocalización
const currentLatitude = ref(null);
const currentLongitude = ref(null);

// Variable para almacenar la URL de la imagen
const imageUrl = ref(null);

// Cargar clientes desde la API
const cargarClientes = async () => {
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
            clientes.value = clientesConEstado;
            // Filtrar clientes pendientes inicialmente
            clientesFiltrados.value = clientesConEstado.filter(cliente => cliente.estado === 'pendiente');

            Swal.fire({
                title: 'Clientes cargados',
                text: 'Los clientes han sido cargados y guardados correctamente.',
                icon: 'success',
                confirmButtonText: 'Entendido',
            });
        } else {
            Swal.fire({
                title: 'Sin clientes',
                text: 'No se encontraron clientes para el usuario proporcionado.',
                icon: 'info',
                confirmButtonText: 'Entendido',
            });
        }
    } catch (error) {
        console.error('Error al cargar los clientes:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al cargar los clientes.',
            icon: 'error',
            confirmButtonText: 'Entendido',
        });
    }
};

// Mostrar clientes guardados en localStorage
const mostrarClientesGuardados = () => {
    const clientesGuardados = localStorage.getItem('clientes');
    if (clientesGuardados) {
        clientes.value = JSON.parse(clientesGuardados);
        // Filtrar clientes pendientes inicialmente
        clientesFiltrados.value = clientes.value.filter(cliente => cliente.estado === 'pendiente');
    }
};

// Verificar y cargar clientes si no se han cargado hoy
const verificarYcargarClientes = async () => {
    const ultimaCargaClientes = localStorage.getItem('ultimaCargaClientes');
    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

    if (!ultimaCargaClientes || new Date(ultimaCargaClientes).toISOString().split('T')[0] !== hoy) {
        await cargarClientes(); // Cargar clientes si no se han cargado hoy
    } else {
        mostrarClientesGuardados(); // Mostrar clientes guardados si ya se han cargado hoy
    }
};

// Watcher para filtrar clientes por nombre y estado
watch([searchTerm, estadoFiltro], () => {
    clientesFiltrados.value = clientes.value.filter((cliente) => {
        const nombreCoincide = cliente.NAME1.toLowerCase().includes(searchTerm.value.toLowerCase()) || cliente.NAME2.toLowerCase().includes(searchTerm.value.toLowerCase());
        const estadoCoincide = estadoFiltro.value === 'Todos' ? true : cliente.estado.toLowerCase() === estadoFiltro.value.toLowerCase();
        return nombreCoincide && estadoCoincide;
    });
});

// Función para calcular la distancia entre dos puntos geográficos usando la fórmula de Haversine
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180; // φ, λ en radianes
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distancia = R * c; // En metros
    return distancia;
};

// Obtener la geolocalización actual del usuario y almacenarla
const obtenerYGuardarGeolocalizacion = () => {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    localStorage.setItem('userLatitude', lat);
                    localStorage.setItem('userLongitude', lon);
                    console.log(`Ubicación obtenida y guardada: Latitud ${lat}, Longitud ${lon}`);
                    resolve({ lat, lon });
                },
                (error) => {
                    console.error('Error obteniendo la geolocalización:', error);
                    // Resolver con valores predeterminados si hay un error
                    resolve({ lat, lon });
                }
            );
        } else {
            console.error('Geolocalización no soportada por el navegador');
            // Resolver con valores predeterminados si la geolocalización no es soportada
            resolve({ lat, lon });
        }
    });
};

// Obtener la geolocalización actual del usuario sin almacenar
const obtenerGeolocalizacion = () => {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    console.log(`Ubicación obtenida: Latitud ${lat}, Longitud ${lon}`);
                    resolve({ lat, lon });
                },
                (error) => {
                    console.error('Error obteniendo la geolocalización:', error);
                    reject(error);
                }
            );
        } else {
            console.error('Geolocalización no soportada por el navegador');
            reject(new Error('Geolocalización no soportada por el navegador'));
        }
    });
};

//Me lleva a entregas
const irAEntregas = (cliente) => {
    if (!cliente.LATITUD || !cliente.LONGITUD) {
        Swal.fire({
            title: 'Ubicación no disponible',
            text: 'El cliente no tiene una ubicación registrada. Puedes tomar la georreferencia desde el botón más y actualizar la información del cliente.',
            icon: 'info',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    // Obtener la ubicación del usuario desde el localStorage
    const userLat = parseFloat(localStorage.getItem('userLatitude'));
    const userLon = parseFloat(localStorage.getItem('userLongitude'));

    if (isNaN(userLat) || isNaN(userLon)) {
        Swal.fire({
            title: 'Error',
            text: 'No se pudo obtener la ubicación actual del usuario.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    // Calcular la distancia entre el usuario y el cliente
    const clienteLat = parseFloat(cliente.LATITUD);
    const clienteLon = parseFloat(cliente.LONGITUD);

    console.log(`Calculando distancia entre usuario y cliente: (${userLat}, ${userLon}) y (${clienteLat}, ${clienteLon})`);

    const distancia = calcularDistancia(clienteLat, clienteLon, userLat, userLon);

    if (distancia > 100) {
        // Mostrar un mensaje de advertencia si la distancia es mayor a 100 metros
        Swal.fire({
            title: 'Advertencia',
            text: 'Estás a más de 100 metros del cliente.',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return; // Salir de la función si la distancia es mayor a 100 metros
    }

    localStorage.setItem('clienteSeleccionado', JSON.stringify(cliente));
    const clienteKunnr = String(cliente.KUNNR); // Asegúrate de convertir KUNNR a string
    router.push({ name: 'entregas', params: { id: clienteKunnr } });
};

// Nueva función para mostrar el submenú
const mostrarSubmenu = async (cliente) => {
    if (cliente) {
        submenuCliente.value = cliente;
        showSubmenu.value = true;
        await obtenerYGuardarGeolocalizacion();
    } else {
        console.error('Cliente es null');
    }
};

// Función para tomar foto
const tomarFoto = async (kunnr) => {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera
        });

        const response = await fetch(image.webPath);
        const blob = await response.blob();

        const file = new File([blob], `${kunnr}.jpg`, { type: "image/jpeg" });
        imageUrl.value = URL.createObjectURL(file);
        console.log('Foto tomada:', imageUrl.value);

        return file;
    } catch (error) {
        console.error('Error al tomar la foto:', error);
        return null;
    }
};

// Función para enviar la georreferencia
const enviarGeorreferencia = async (kunnr, latitud, longitud, file) => {
    const formData = new FormData();
    formData.append('kunnr', kunnr);
    formData.append('latitud', latitud);
    formData.append('longitud', longitud);
    if (file) {
        formData.append('file', file);
    }

    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/clientes/update/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        Swal.fire('Guardado', 'La georreferencia ha sido guardada correctamente.', 'success');
        console.log('Respuesta de la API:', response.data);

        // Recargar la lista completa de clientes para obtener la información actualizada
        await cargarClientes(); // Esto actualizará el localStorage con la nueva información
    } catch (error) {
        console.error('Error al enviar la georreferencia:', error);
        Swal.fire('Error', 'Hubo un problema al guardar la georreferencia.', 'error');
    }
};

// Funciones para el submenú
const handleSubmenuClick = async (option) => {
    switch (option.value) {
        case 'georreferencia':
            const fotoFile = await tomarFoto(submenuCliente.value.KUNNR);
            if (fotoFile) {
                const userLat = parseFloat(localStorage.getItem('userLatitude'));
                const userLon = parseFloat(localStorage.getItem('userLongitude'));
                Swal.fire({
                    title: 'Tomar Georreferencia',
                    html: `
                        <p>Latitud: ${userLat}</p>
                        <p>Longitud: ${userLon}</p>
                        <img src="${imageUrl.value}" alt="Foto tomada" style="width: 100%; height: auto;" />
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Guardar',
                    cancelButtonText: 'Cancelar',
                    preConfirm: () => {
                        if (isNaN(userLat) || isNaN(userLon) || !fotoFile) {
                            Swal.showValidationMessage(`Por favor completa todos los campos`);
                        }
                        return { latitud: userLat, longitud: userLon, file: fotoFile };
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Enviar la georreferencia al servidor con la imagen
                        enviarGeorreferencia(submenuCliente.value.KUNNR, result.value.latitud, result.value.longitud, result.value.file);
                    }
                });
            }
            break;
        case 'ruta':
            const urlWaze = `https://www.waze.com/ul?ll=${currentLatitude.value},${currentLongitude.value}&navigate=yes`;
            const urlMaps = `https://www.google.com/maps/dir/?api=1&origin=${currentLatitude.value},${currentLongitude.value}&destination=${submenuCliente.value.LATITUD},${submenuCliente.value.LONGITUD}`;
            Swal.fire({
                title: 'Graficar Ruta',
                html: `
                    <button onclick="window.open('${urlWaze}', '_blank')" class="swal2-confirm swal2-styled">Abrir en Waze
                    </button><br>
                    <button onclick="window.open('${urlMaps}', '_blank')" class="swal2-confirm swal2-styled">Abrir en Google Maps
                    </button>
                `,
                showCancelButton: true,
                cancelButtonText: 'Cerrar'
            });
            break;
        case 'encuesta':
            const urlEncuesta = `https://www.example.com/encuesta?kunnr=${submenuCliente.value.KUNNR}`;
            window.open(urlEncuesta, '_blank');
            break;
        case 'llamada':
            const numeroTelefono = submenuCliente.value.TELF1;
            window.open(`tel:${numeroTelefono}`);
            break;
    }
    showSubmenu.value = false;
};

onMounted(() => {
    verificarYcargarClientes();
    obtenerYGuardarGeolocalizacion(); // Obtener y guardar la ubicación del usuario al montar el componente
});
</script>
<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12">
            <div class="mt-4">
                <!-- Campo de búsqueda -->
                <input v-model="searchTerm" type="text" placeholder="Buscar cliente por nombre..." class="w-full p-2 border rounded mb-4" />
            </div>

            <!-- Filtro por estado -->
            <div class="mt-4">
                <Dropdown v-model="estadoFiltro" :options="[ 'Pendiente','Atendido','Todos']" placeholder="Filtrar por estado" class="w-full p-2 border rounded mb-4"/>
            </div>

            <!-- Mostrar clientes en DataView -->
            <div v-if="clientesFiltrados.length > 0" class="mt-4">
                <DataView :value="clientesFiltrados" :layout="layout">
                    <template #header>
                        <div class="font-semibold text-xl">Lista de clientes</div>
                        <div class="flex justify-end">
                            <SelectButton v-model="layout" :options="options" :allowEmpty="false">
                                <template #option="{ option }">
                                    <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']" />
                                </template>
                            </SelectButton>
                        </div>
                    </template>
                    <!-- Diseño en formato grid -->
                    <template #grid="slotProps">
                        <div class="grid grid-cols-12 gap-4">
                            <div v-for="(cliente) in slotProps.items" :key="cliente.KUNNR" 
                                class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                                <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col" :style="{ backgroundColor: cliente.estado === 'atendido' ? '#d4edda' : '#f8d7da' }">
                                    <div class="flex flex-row justify-between items-start gap-2">
                                        <div>
                                            <span class="text-lg font-semibold">{{ cliente.NAME1 }}</span>
                                            <div class="text-lg font-medium mt-1">{{ cliente.NAME2 }}</div>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">Dirección: {{ cliente.STRAS }}</span>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.LATITUD }}</span>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.LONGITUD }}</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-6 mt-6">
                                        <div class="flex gap-2">
                                            <Button icon="pi pi-th-large" label="Más" class="flex-auto whitespace-nowrap" @click="() => mostrarSubmenu(cliente)" />
                                            <Button icon="pi pi-briefcase" label="Visitar" class="flex-auto md:flex-initial whitespace-nowrap" @click="irAEntregas(cliente)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <!-- Diseño en formato lista -->
                    <template #list="slotProps">
                        <div class="flex flex-col">
                            <div v-for="(cliente) in slotProps.items" :key="cliente.KUNNR">
                                <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                                    :style="{ backgroundColor: cliente.estado === 'atendido' ? '#d4edda' : '#f8d7da' }">
                                    <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                        <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                            <div>
                                                <div class="text-lg font-medium mt-2">{{ cliente.NAME1 }}</div>
                                                <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.NAME2 }}</span>
                                            </div>
                                            <div class="bg-surface-100 p-1" style="border-radius: 30px">
                                                <div class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2" style="border-radius: 30px;">
                                                    <span class="text-surface-900 font-medium text-sm">Dirección: {{ cliente.STRAS }}</span>
                                                    <i class="pi pi-map text-500"></i>
                                                    <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.LATITUD }}</span>
                                                    <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.LONGITUD }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-col md:items-end gap-8">
                                            <div class="flex flex-row-reverse md:flex-row gap-2">
                                                <Button icon="pi pi-th-large" label="Más" class="flex-auto md:flex-initial whitespace-nowrap" @click="() => mostrarSubmenu(cliente)" />
                                                <Button icon="pi pi-briefcase" label="Visitar" class="flex-auto md:flex-initial whitespace-nowrap" @click="irAEntregas(cliente)" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </DataView>
            </div>

            <!-- Mensaje si no hay clientes cargados -->
            <div v-else class="text-xl mt-4">No hay clientes cargados.</div>
        </div>

        <!-- Submenú Modal -->
        <Dialog header="Opciones" v-model:visible="showSubmenu" :modal="true" :closable="true">
            <div class="flex flex-col gap-4">
                <Button icon="pi pi-compass" label="Tomar Georreferencia" @click="handleSubmenuClick({ value: 'georreferencia' })" />
                <Button icon="pi pi-map" label="Graficar Ruta" @click="handleSubmenuClick({ value: 'ruta' })" />
                <Button icon="pi pi-question-circle" label="Formulario de Encuestas" @click="handleSubmenuClick({ value: 'encuesta' })" />
                <Button icon="pi pi-phone" label="Llamada Telefónica" @click="handleSubmenuClick({ value: 'llamada' })" />
            </div>
        </Dialog>
    </div>
</template>