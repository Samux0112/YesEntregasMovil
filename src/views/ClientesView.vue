<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import Swal from 'sweetalert2';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const options = ref(['list', 'grid']);
const layout = ref('grid'); // Inicializa en 'grid'
const searchTerm = ref('');
const clientesFiltrados = ref([]);
const authStore = useAuthStore();
const username = computed(() => authStore.user?.Username || 'Invitado');
const clientes = ref([]);
const estadoFiltro = ref('Todos'); // Estado del filtro, inicializado en 'Todos'

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
            clientesFiltrados.value = clientesConEstado;

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

const mostrarClientesGuardados = () => {
    const clientesGuardados = localStorage.getItem('clientes');
    if (clientesGuardados) {
        clientes.value = JSON.parse(clientesGuardados);
        clientesFiltrados.value = JSON.parse(clientesGuardados);
    }
};

const verificarYcargarClientes = async () => {
    const ultimaCargaClientes = localStorage.getItem('ultimaCargaClientes');
    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

    if (!ultimaCargaClientes || new Date(ultimaCargaClientes).toISOString().split('T')[0] !== hoy) {
        await cargarClientes(); // Cargar clientes si no se han cargado hoy
    } else {
        mostrarClientesGuardados(); // Mostrar clientes guardados si ya se han cargado hoy
    }
};

watch([searchTerm, estadoFiltro], () => {
    clientesFiltrados.value = clientes.value.filter((cliente) => {
        const nombreCoincide = cliente.NAME1.toLowerCase().includes(searchTerm.value.toLowerCase()) || cliente.NAME2.toLowerCase().includes(searchTerm.value.toLowerCase());
        const estadoCoincide = estadoFiltro.value === 'Todos' ? true : cliente.estado === estadoFiltro.value.toLowerCase();
        return nombreCoincide && estadoCoincide;
    });
});

const irAEntregas = (cliente) => {
    localStorage.setItem('clienteSeleccionado', JSON.stringify(cliente));
    const clienteKunnr = String(cliente.KUNNR); // Asegúrate de convertir KUNNR a string
    router.push({ name: 'entregas', params: { id: clienteKunnr } });
};

// Nueva función para mostrar el submenú
const mostrarSubmenu = (cliente) => {
    if (cliente) {
        submenuCliente.value = cliente;
        showSubmenu.value = true;
        obtenerGeolocalizacion();
    } else {
        console.error('Cliente es null');
    }
};

// Funciones para el submenú
const handleSubmenuClick = (option) => {
    switch (option.value) {
        case 'georreferencia':
            Swal.fire({
                title: 'Tomar Georreferencia',
                html: `
                    <p>Latitud: ${currentLatitude.value}</p>
                    <p>Longitud: ${currentLongitude.value}</p>
                    <input type="file" id="foto" class="swal2-file">
                `,
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    const foto = Swal.getPopup().querySelector('#foto').files[0];
                    if (!currentLatitude.value || !currentLongitude.value || !foto) {
                        Swal.showValidationMessage(`Por favor completa todos los campos`);
                    }
                    return { latitud: currentLatitude.value, longitud: currentLongitude.value, foto };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Aquí puedes manejar el guardado de la georreferencia y la foto
                    console.log(result.value);
                }
            });
            break;
        case 'ruta':
            const urlWaze = `https://www.waze.com/ul?ll=${currentLatitude.value},${currentLongitude.value}&navigate=yes`;
            const urlMaps = `https://www.google.com/maps/dir/?api=1&origin=${currentLatitude.value},${currentLongitude.value}&destination=${submenuCliente.value.LATITUD},${submenuCliente.value.LONGITUD}`;
            Swal.fire({
                title: 'Graficar Ruta',
                html: `
                    <button onclick="window.open('${urlWaze}', '_blank')" class="swal2-confirm swal2-styled">
                        <font-awesome-icon :icon="['fab', 'waze']" /> Abrir en Waze
                    </button><br>
                    <button onclick="window.open('${urlMaps}', '_blank')" class="swal2-confirm swal2-styled">
                        <font-awesome-icon :icon="['fab', 'google']" /> Abrir en Google Maps
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

// Obtener la geolocalización actual del usuario
const obtenerGeolocalizacion = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            currentLatitude.value = position.coords.latitude;
            currentLongitude.value = position.coords.longitude;
        }, (error) => {
            console.error('Error obteniendo la geolocalización:', error);
        });
    } else {
        console.error('Geolocalización no soportada por el navegador');
        Swal.fire({
            title: 'Error',
            text: 'Geolocalización no soportada por el navegador.',
            icon: 'error',
            confirmButtonText: 'Entendido',
        });
    }
};

onMounted(() => {
    verificarYcargarClientes();
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
                <Dropdown v-model="estadoFiltro" :options="['Todos', 'Atendido', 'Pendiente']" placeholder="Filtrar por estado" class="w-full p-2 border rounded mb-4"/>
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
            <div v-if="currentLatitude && currentLongitude" class="mt-4">
                <p>Ubicación actual:</p>
                <p>Latitud: {{ currentLatitude }}</p>
                <p>Longitud: {{ currentLongitude }}</p>
            </div>
        </Dialog>
    </div>
</template>