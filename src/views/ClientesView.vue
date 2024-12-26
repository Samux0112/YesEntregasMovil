<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import Swal from 'sweetalert2';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const options = ref(['list', 'grid']);
const layout = ref('list');
const searchTerm = ref('');
const clientesFiltrados = ref([]);
const authStore = useAuthStore();
const username = computed(() => authStore.user?.Username || 'Invitado');
const clientes = ref([]);
const estadoFiltro = ref('Todos'); // Estado del filtro, inicializado en 'Todos'

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

onMounted(() => {
    mostrarClientesGuardados();
});
</script>


<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12">
            <Button label="Cargar clientes" class="w-auto p-2 text-sm" @click="cargarClientes" />

            <div class="mt-4">
                <!-- Campo de búsqueda -->
                <input v-model="searchTerm" type="text" placeholder="Buscar cliente por nombre..."
                    class="w-full p-2 border rounded mb-4" />
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
                    <!-- Diseño en formato lista -->
                    <template #list="slotProps">
                        <div class="flex flex-col">
                            <div v-for="(cliente) in slotProps.items" :key="cliente.KUNNR">
                                <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4" :class="{'bg-green-100': cliente.estado === 'atendido', 'bg-red-100': cliente.estado === 'pendiente'}">
                                    <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                        <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                            <div>
                                                <div class="text-lg font-medium mt-2">{{ cliente.NAME1 }}</div>
                                                <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">
                                                    {{ cliente.NAME2 }}
                                                </span>
                                            </div>
                                            <div class="bg-surface-100 p-1" style="border-radius: 30px">
                                                <div class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2" style="border-radius: 30px;">
                                                    <span class="text-surface-900 font-medium text-sm">Direccion: {{ cliente.STRAS }}</span>
                                                    <i class="pi pi-map text-500"></i>
                                                    <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.LATITUD }}</span>
                                                    <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.LONGITUD }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-col md:items-end gap-8">
                                            <div class="flex flex-row-reverse md:flex-row gap-2">
                                                <Button icon="pi pi-th-large" label="Mas" class="flex-auto md:flex-initial whitespace-nowrap" />
                                                <Button icon="pi pi-briefcase" label="Visitar" class="flex-auto md:flex-initial whitespace-nowrap" @click="irAEntregas(cliente)" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <!-- Diseño en formato grid -->
                    <template #grid="slotProps">
                        <div class="grid grid-cols-12 gap-4">
                            <div v-for="(cliente) in slotProps.items" :key="cliente.KUNNR" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                                <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col" :class="{'bg-green-100': cliente.estado === 'atendido', 'bg-red-100': cliente.estado === 'pendiente'}">
                                    <div class="flex flex-row justify-between items-start gap-2">
                                        <div>
                                            <span class="text-lg font-semibold">{{ cliente.NAME1 }}</span>
                                            <div class="text-lg font-medium mt-1">{{ cliente.NAME2 }}</div>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">Direccion: {{ cliente.STRAS }}</span>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.LATITUD }}</span>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{ cliente.LONGITUD }}</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-6 mt-6">
                                        <div class="flex gap-2">
                                            <Button icon="pi pi-th-large" label="Mas" class="flex-auto whitespace-nowrap" />
                                            <Button icon="pi pi-briefcase" label="Visitar" class="flex-auto md:flex-initial whitespace-nowrap" @click="irAEntregas(cliente)" />
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
    </div>
</template>