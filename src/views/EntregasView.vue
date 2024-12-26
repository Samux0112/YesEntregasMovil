<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Swal from 'sweetalert2';

const route = useRoute();
const cliente = ref(null);
const arktxList = ref([]);
const loading = ref(false);
const authStore = useAuthStore();
const username = computed(() => authStore.user?.Username);
const filters1 = ref({});
const showConfirmButton = ref(false); // Estado para mostrar el botón de confirmar productos entregados en el header

// Estado para el diálogo y el combo box
const showDialog = ref(false);
const selectedOption = ref(null);
const comment = ref('');
const options = [
    { label: 'Entregado', value: 'entregado' },
    { label: 'Parcial', value: 'parcial' },
    { label: 'No Entregado', value: 'no_entregado' }
];

// Computed properties
const totalItems = computed(() => arktxList.value.length);
const totalCantidad = computed(() => {
    return arktxList.value.reduce((acc, item) => acc + item.FKIMG, 0);
});

// Funciones
const handleEntregar = () => {
    showDialog.value = true;
};

const handleDialogConfirm = () => {
    showDialog.value = false;
    let estadoCliente = 'pendiente';
    switch (selectedOption.value) {
        case 'entregado':
            Swal.fire({
                title: 'Confirmar Entrega',
                text: '¿Estás seguro que deseas confirmar la entrega de todos los productos?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, confirmar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    estadoCliente = 'atendido';
                    guardarEstadoCliente(estadoCliente);
                    Swal.fire('Entregado', 'Todos los productos han sido entregados.', 'success');
                }
            });
            break;
        case 'parcial':
            Swal.fire({
                title: 'Entrega Parcial',
                input: 'textarea',
                inputLabel: 'Comentarios',
                inputPlaceholder: 'Escribe los comentarios aquí...',
                inputValue: comment.value,
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    comment.value = result.value;
                    localStorage.setItem('entrega_parcial', result.value);
                    arktxList.value.forEach(item => item.editable = true); // Hacer editable aquí
                    showConfirmButton.value = true; // Mostrar el botón de confirmar productos entregados
                    // Borrar datos de `localStorage` para que se puedan manejar los nuevos datos ingresados
                    localStorage.removeItem(`productos_${cliente.value.KUNNR}`);
                    estadoCliente = 'atendido';
                    guardarEstadoCliente(estadoCliente);
                    Swal.fire('Guardado', 'Los comentarios han sido guardados y ahora puede editar las cantidades.', 'success');
                }
            });
            break;
        case 'no_entregado':
            Swal.fire({
                title: 'No Entregado',
                input: 'textarea',
                inputLabel: 'Razón de No Entrega',
                inputPlaceholder: 'Escribe la razón aquí...',
                inputValue: comment.value,
                showCancelButton: true,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    comment.value = result.value;
                    localStorage.setItem('no_entregado', result.value);
                    estadoCliente = 'pendiente';
                    guardarEstadoCliente(estadoCliente);
                    Swal.fire('Guardado', 'La razón ha sido guardada.', 'success');
                }
            });
            break;
    }
};

// Guardar el estado del cliente en localStorage
const guardarEstadoCliente = (estado) => {
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let clienteIndex = clientes.findIndex(c => c.KUNNR === cliente.value.KUNNR);
    if (clienteIndex !== -1) {
        clientes[clienteIndex].estado = estado;
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }
};

// Manejar la confirmación de productos entregados
const handleConfirmAll = () => {
    Swal.fire({
        title: 'Confirmar productos entregados',
        text: '¿Estás seguro que deseas confirmar todos los productos entregados?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Desactivar edición y guardar en localStorage
            arktxList.value.forEach(item => item.editable = false);
            localStorage.setItem(`productos_${cliente.value.KUNNR}`, JSON.stringify(arktxList.value));
            guardarEstadoCliente('atendido');
            Swal.fire('Confirmado', 'Todos los productos entregados han sido confirmados.', 'success');
        }
    });
};

// Manejar la edición de la cantidad entregada
const handleConfirm = (item) => {
    item.editable = false;
    // Eliminar valor anterior y aceptar el nuevo
    localStorage.setItem(`productos_${cliente.value.KUNNR}`, JSON.stringify(arktxList.value));
};

// Enviar datos a un endpoint
const enviarDatos = async () => {
    try {
        const response = await axios.post('https://tu-endpoint.com/api/guardar', {
            cliente: cliente.value,
            productos: arktxList.value,
            comentario: comment.value
        });
        Swal.fire('Enviado', 'Los datos han sido enviados correctamente.', 'success');
    } catch (error) {
        Swal.fire('Error', 'Hubo un error al enviar los datos.', 'error');
    }
};

// Recuperar el cliente desde localStorage o buscarlo con el id de la URL
const cargarCliente = () => {
    const clienteGuardado = JSON.parse(localStorage.getItem('clienteSeleccionado'));

    if (!clienteGuardado) {
        const clienteId = route.params.id;
        const clientesGuardados = JSON.parse(localStorage.getItem('clientes') || '[]');
        cliente.value = clientesGuardados.find(c => String(c.KUNNR) === clienteId);
        console.log('Cliente cargado desde URL:', cliente.value);
    } else {
        cliente.value = clienteGuardado;
        console.log('Cliente cargado desde localStorage:', cliente.value);
    }
};

// Función para limpiar los valores y eliminar caracteres no deseados
const limpiarValor = (valor) => {
    return String(valor).replace(/[^\x20-\x7E]/g, '').trim();
};

// Cargar productos desde la API
const cargarProductosDesdeAPI = async () => {
    if (cliente.value && username.value) {
        loading.value = true;
        try {
            const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/entregas/', {
                bzirk: username.value
            });

            console.log('Respuesta de la API:', response.data);

            const entregas = response.data;
            const entregasCliente = entregas.filter(entrega => {
                const kunag = limpiarValor(entrega.KUNAG);
                const kunnr = limpiarValor(cliente.value.KUNNR);

                console.log(`Comparando KUNAG: "${kunag}" con KUNNR: "${kunnr}"`);

                return kunag === kunnr;
            });

            if (entregasCliente.length > 0) {
                arktxList.value = entregasCliente.map(entrega => ({
                    ARKTX: entrega.ARKTX,
                    FKIMG: parseFloat(entrega.FKIMG),
                    VBELN: entrega.VBELN,
                    entregado: entrega.FKIMG, // Inicializar con la misma cantidad
                    editable: false // Inicialmente no editable
                }));
                localStorage.setItem(`productos_${cliente.value.KUNNR}`, JSON.stringify(arktxList.value));
                console.log('Productos guardados en localStorage:', arktxList.value);
            } else {
                console.log('No se encontró coincidencia entre KUNNR y KUNNAG');
            }
        } catch (error) {
            console.error('Error al obtener entregas:', error);
        } finally {
            loading.value = false;
        }
    }
};

// Cargar productos desde localStorage
const cargarProductosDesdeLocalStorage = () => {
    const productosGuardados = JSON.parse(localStorage.getItem(`productos_${cliente.value.KUNNR}`));
    if (productosGuardados) {
        arktxList.value = productosGuardados;
        console.log('Productos cargados desde localStorage:', arktxList.value);
    }
};

// Watcher para mostrar el botón de confirmar productos entregados cuando se selecciona "Parcial"
watch(selectedOption, (newValue) => {
    showConfirmButton.value = (newValue === 'parcial');
});

onMounted(() => {
    cargarCliente();
    cargarProductosDesdeAPI();
    cargarProductosDesdeLocalStorage();
});
</script>
<template>
    <div>
        <div v-if="cliente">
            <DataTable
                :value="arktxList"
                :paginator="true"
                :rows="10"
                dataKey="id"
                :rowHover="true"
                filterDisplay="menu"
                :loading="loading"
                showGridlines
            >
                <template #header>
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <div class="font-semibold text-l">Cliente: {{ cliente.NAME1 }} ({{ cliente.NAME2 }})</div>
                            <div class="flex">
                                <div class="font-semibold text-l">{{ cliente.KUNNR }}</div>
                                <div class="font-semibold text-l ml-4" v-if="arktxList.length > 0"> Documento: {{ arktxList[0].VBELN }}</div>
                            </div>
                            <div class="flex">
                                <div class="font-semibold text-l">Latitud: {{ cliente.LATITUD }}</div>
                                <div class="font-semibold text-l ml-4">Longitud: {{ cliente.LONGITUD }}</div>
                            </div>
                            <div class="flex">
                                <div class="font-semibold text-l"># de JABAS: </div>
                                <div class="font-semibold text-l ml-4"># de PALETS: </div>
                            </div>
                            <div class="flex items-center">
                                <div class="font-semibold text-l">Entrega: </div>
                                <Button label="Entregar" icon="pi pi-check" class="ml-4" @click="handleEntregar" />
                            </div>
                            <div class="flex">
                                <div class="font-semibold text-l">Total de Items: {{ totalItems }}</div>
                                <div class="font-semibold text-l ml-4">Total Cantidad: {{ totalCantidad }}</div>
                            </div>
                        </div>
                    </div>
                </template>
                <template #empty> No se encontraron productos </template>
                <template #loading> Cargando productos, por favor espere. </template>
                <Column field="ARKTX" header="Descripción" style="min-width: 12rem" />
                <Column field="FKIMG" header="Cantidad" style="min-width: 12rem" />
                <Column 
                    field="entregado" 
                    header="Confirmar entregados" 
                    style="min-width: 12rem"
                >
                    <template #header>
                        <div class="flex justify-between items-center">
                            <span>Entregado</span>
                            <Button 
                                v-if="showConfirmButton" 
                                icon="pi pi-check" 
                                class="ml-2" 
                                @click="handleConfirmAll" 
                            />
                        </div>
                    </template>
                    <template #body="slotProps">
                        <div class="flex items-center">
                            <InputNumber 
                                v-model="slotProps.data.entregado" 
                                mode="decimal" 
                                :disabled="!slotProps.data.editable"
                            />
                            <Button 
                                icon="pi pi-check" 
                                class="ml-2" 
                                :disabled="!slotProps.data.editable" 
                                @click="handleConfirm(slotProps.data)" 
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
            <Button label="Enviar Datos" icon="pi pi-send" class="mt-4" @click="enviarDatos" />
        </div>
        <div v-else>
            <p>Cliente no encontrado.</p>
        </div>

        <!-- Dialog Modal -->
        <Dialog header="Seleccionar Opción" v-model:visible="showDialog" :modal="true" :closable="false">
            <Dropdown v-model="selectedOption" :options="options" option-label="label" option-value="value" placeholder="Seleccione una opción" class="w-full mb-3" />
            <InputTextarea v-model="comment" placeholder="Ingrese los comentarios aquí..." rows="3" class="w-full mb-3" />
            <div class="flex justify-content-end">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="showDialog = false" />
                <Button label="Aceptar" icon="pi pi-check" class="p-button-text" @click="handleDialogConfirm" />
            </div>
        </Dialog>
    </div>
</template>