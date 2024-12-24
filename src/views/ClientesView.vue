<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import Swal from 'sweetalert2';
import { computed, onMounted, ref } from 'vue';
const options = ref(['list', 'grid']);
const layout = ref('list');
// Accede al store de autenticación
const authStore = useAuthStore();

// Obtén el nombre de usuario desde el store
const username = computed(() => authStore.user?.Username || 'Invitado');

// Estado para los clientes cargados
const clientes = ref([]);

// Función para cargar clientes desde el endpoint y guardarlos en localStorage
const cargarClientes = async () => {
    try {
        const response = await axios.post('https://yesentregas-api.yes.com.sv/clientes/', {
            sortl: username.value
        });

        if (response.data && response.data.length > 0) {
            // Guardar los clientes en localStorage
            localStorage.setItem('clientes', JSON.stringify(response.data));
            clientes.value = response.data;

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

// Función para mostrar los clientes guardados desde localStorage
const mostrarClientesGuardados = () => {
    const clientesGuardados = localStorage.getItem('clientes');
    if (clientesGuardados) {
        clientes.value = JSON.parse(clientesGuardados);
    }
};

// Llamar las funciones al montar el componente
onMounted(() => {
    mostrarClientesGuardados();
});


</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12">
            <!-- Mostrar clientes en DataView -->
            <div v-if="clientes.length > 0" class="mt-4">
                <DataView :value="clientes" :layout="layout">
                    <template #header>
                        <div class="font-semibold text-xl">Clientes</div>
                        <Button label="Cargar clientes" class="w-auto p-2 text-sm" @click="cargarClientes"></Button>
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
                                <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                                    :class="{ 'border-t border-surface': index !== 0 }">
                                    <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                        <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                            <div>

                                                <div class="text-lg font-medium mt-2">{{ cliente.NAME1 }}</div>
                                                <span
                                                    class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{
                                                        cliente.NAME2 }}</span>
                                            </div>
                                            <div class="bg-surface-100 p-1" style="border-radius: 30px">
                                                <div class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2"
                                                    style="
                                                    border-radius: 30px;
                                                    box-shadow:
                                                        0px 1px 2px 0px rgba(0, 0, 0, 0.04),
                                                        0px 1px 2px 0px rgba(0, 0, 0, 0.06);
                                                ">
                                                    <span class="text-surface-900 font-medium text-sm">Direccion: {{
                                                        cliente.STRAS
                                                        }}</span>
                                                    <i class="pi pi-map text-500"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-col md:items-end gap-8">
                                            <div class="flex flex-row-reverse md:flex-row gap-2">
                                                <Button icon="pi pi-th-large" label="Mas"
                                                    class="flex-auto md:flex-initial whitespace-nowrap"></Button>
                                                <Button icon="pi pi-briefcase" label="Visitar"
                                                    class="flex-auto md:flex-initial whitespace-nowrap"></Button>
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
                            <div v-for="(cliente) in slotProps.items" :key="cliente.KUNNR"
                                class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                                <div
                                    class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col">
                                    <div class="flex flex-row justify-between items-start gap-2">
                                        <div>
                                            <span class="text-2xl font-semibold">{{ cliente.NAME1 }}</span>
                                            <div class="text-lg font-medium mt-1">{{ cliente.NAME2 }}</div>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{
                                                cliente.STRAS }}</span>
                                        </div>

                                    </div>
                                    <div class="flex flex-col gap-6 mt-6">
                                        <div class="flex gap-2">
                                            <Button icon="pi pi-th-large" label="Mas"
                                                class="flex-auto whitespace-nowrap"></Button>
                                            <Button icon="pi pi-briefcase" label="Visitar"
                                                class="flex-auto whitespace-nowrap"></Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </DataView>
            </div>

            <!-- Mensaje si no hay clientes cargados -->
            <div v-else class="text-xl mt-4">
                No hay clientes cargados.
            </div>
        </div>
    </div>

</template>
