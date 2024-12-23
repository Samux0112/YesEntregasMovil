<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import Swal from 'sweetalert2';
import { computed, onMounted, ref } from 'vue';

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
        <div class="col-span-12 text-center">
            <h1 class="text-3xl font-bold">Clientes</h1>
            <br>
            <!-- Botón para cargar clientes -->
            <Button
                label="Cargar clientes"
                class="w-auto p-2 text-sm"
                @click="cargarClientes"
            ></Button>
            <br><br>

            <!-- Mostrar clientes cargados -->
            <div v-if="clientes.length > 0" class="mt-4">
                <h2 class="text-2xl font-semibold mb-4">Lista de Clientes:</h2>
                <table class="table-auto w-full border">
                    <thead>
                        <tr>
                            <th class="border px-4 py-2">Código</th>
                            <th class="border px-4 py-2">Nombre</th>
                            <th class="border px-4 py-2">Dirección</th>
                            <th class="border px-4 py-2">Teléfono</th>
                            <th class="border px-4 py-2">Municipio</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="cliente in clientes" :key="cliente.KUNNR">
                            <td class="border px-4 py-2">{{ cliente.KUNNR }}</td>
                            <td class="border px-4 py-2">{{ cliente.NAME1 }}</td>
                            <td class="border px-4 py-2">{{ cliente.STRAS }}</td>
                            <td class="border px-4 py-2">{{ cliente.TELF1 }}</td>
                            <td class="border px-4 py-2">{{ cliente.MUNIC }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-else class="text-xl mt-4">
                No hay clientes cargados.
            </div>
        </div>
    </div>
</template>
