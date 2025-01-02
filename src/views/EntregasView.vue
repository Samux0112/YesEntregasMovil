<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2';

// Variables y referencias
const route = useRoute();
const router = useRouter();
const cliente = ref(null);
const arktxList = ref([]);
const loading = ref(false);
const authStore = useAuthStore();
const username = computed(() => authStore.user?.Username);
const filters1 = ref({});
const showConfirmButton = ref(false);

// Estado para el diálogo y el combo box
const showDialog = ref(false);
const selectedOption = ref(null);
const selectedMotivo = ref(null);
const comment = ref('');
const options = [
    { label: 'Entregado', value: 'entregado' },
    { label: 'Parcial', value: 'parcial' },
    { label: 'No Entregado', value: 'no_entregado' }
];
const motivos = ref([]);

// Computed properties
const totalItems = computed(() => arktxList.value.length);
const totalCantidad = computed(() => {
    return arktxList.value.reduce((acc, item) => acc + item.FKIMG, 0);
});

// Funciones
const handleEntregar = () => {
    showDialog.value = true;
};

const handleDialogConfirm = async () => {
    showDialog.value = false;
    let estadoCliente = 'pendiente';

    if (selectedOption.value === 'entregado') {
        const entregadoData = arktxList.value.map(item => ({
            vbeln: item.VBELN,
            posnr: item.POSNR,
            entregado: item.entregado
        }));

        console.log('Datos enviados para "Entregado":', entregadoData);

        try {
            await axios.post('https://calidad-yesentregas-api.yes.com.sv/entregas/update/', entregadoData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                }
            });
            estadoCliente = 'atendido';
            actualizarClientes(estadoCliente);
            Swal.fire('Entregado', 'Todos los productos han sido entregados.', 'success').then(() => {
                router.push('/clientes'); // Redirige al menú de clientes
            });
        } catch (error) {
            console.error('Error al actualizar la entrega:', error);
            Swal.fire('Error', 'Hubo un error al actualizar la entrega.', 'error');
        }
    } else if (selectedOption.value === 'parcial' || selectedOption.value === 'no_entregado') {
        if (!selectedMotivo.value) {
            Swal.fire('Error', 'Por favor seleccione un motivo.', 'error');
            return;
        }
        const tipo = selectedOption.value === 'parcial' ? 2 : 3;
        const complementoData = {
            vbeln: arktxList.value[0]?.VBELN || '',
            posnr: arktxList.value[0]?.POSNR || '',
            tipo: tipo,
            motivo: Number(selectedMotivo.value),
            comentario: comment.value
        };

        console.log('Datos enviados para "Parcial" o "No Entregado":', complementoData);

        try {
            await axios.post('https://calidad-yesentregas-api.yes.com.sv/entregas/complementarios/update/', complementoData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.token}`
                }
            });

            if (selectedOption.value === 'no_entregado') {
                const noEntregadoData = arktxList.value.map(item => ({
                    vbeln: item.VBELN,
                    posnr: item.POSNR,
                    entregado: 0 // Enviar 0 cuando no entregado
                }));

                console.log('Datos enviados para "No Entregado":', noEntregadoData);

                await axios.post('https://calidad-yesentregas-api.yes.com.sv/entregas/update/', noEntregadoData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authStore.token}`
                    }
                });

                estadoCliente = 'pendiente';
                actualizarClientes(estadoCliente);
                Swal.fire('Guardado', 'Los datos han sido guardados.', 'success').then(() => {
                    router.push('/clientes'); // Redirige al menú de clientes
                });
            } else {
                estadoCliente = 'atendido';
                actualizarClientes(estadoCliente);
                Swal.fire('Guardado', 'Los datos han sido guardados.', 'success').then(() => {
                    arktxList.value.forEach(item => item.editable = true); // Activar edición de productos
                });
            }
        } catch (error) {
            console.error('Error al actualizar el complemento:', error);
            Swal.fire('Error', 'Hubo un error al actualizar el complemento.', 'error');
        }
    }
};

// Actualizar el estado del cliente en localStorage
const actualizarClientes = (estado) => {
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let clienteIndex = clientes.findIndex(c => c.KUNNR === cliente.value.KUNNR);
    if (clienteIndex !== -1) {
        clientes[clienteIndex].estado = estado; // Actualizar el estado del cliente
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }
};

// Manejar la confirmación de productos entregados
const handleConfirmAll = async () => {
    const entregadoData = arktxList.value.map(item => ({
        vbeln: item.VBELN,
        posnr: item.POSNR,
        entregado: item.entregado
    }));

    console.log('Datos enviados para confirmación:', entregadoData);

    try {
        await axios.post('https://calidad-yesentregas-api.yes.com.sv/entregas/update/', entregadoData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.token}`
            }
        });
        Swal.fire('Confirmado', 'Todos los productos han sido confirmados.', 'success').then(() => {
            router.push('/clientes'); // Redirige al menú de clientes
        });
    } catch (error) {
        console.error('Error al confirmar la entrega:', error);
        Swal.fire('Error', 'Hubo un error al confirmar la entrega.', 'error');
    }
};

// Manejar la edición de la cantidad entregada
const handleConfirm = (item) => {
    item.editable = false;
    // Eliminar valor anterior y aceptar el nuevo
    localStorage.setItem(`productos_${cliente.value.KUNNR}`, JSON.stringify(arktxList.value));
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
                    POSNR: entrega.POSNR,
                    entregado: entrega.FKIMG, // Inicializar con la misma cantidad
                    editable: true // Inicialmente editable
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

// Función para obtener los motivos desde la API
const obtenerMotivos = async () => {
    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/motivos/');
        console.log('Motivos obtenidos:', response.data);
        // Asegúrate de que response.data sea un array antes de mapear
        if (Array.isArray(response.data)) {
            motivos.value = response.data.map(motivo => ({
                label: motivo.descripcion, // Usar 'descripcion' para el label
                value: motivo.id
            }));
        } else {
            console.error('La respuesta de la API no es un array:', response.data);
        }
    } catch (error) {
        console.error('Error al obtener los motivos:', error);
        Swal.fire('Error', 'Hubo un problema al obtener los motivos.', 'error');
    }
};

// Watcher para mostrar el botón de confirmar productos entregados cuando se selecciona "Parcial" y cargar motivos
watch(selectedOption, async (newValue) => {
    showConfirmButton.value = (newValue === 'parcial');
    if (newValue === 'parcial' || newValue === 'no_entregado') {
        await obtenerMotivos();
    }
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
                    header="Confirmar" 
                    style="min-width: 12rem"
                >
                    <template #header>
                        <div class="flex justify-between items-center">
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
                            <InputText 
                                v-model="slotProps.data.entregado" 
                                class="small-input" 
                                :disabled="!slotProps.data.editable"
                                @input="handleInput(slotProps.data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
        <div v-else>
            <p>Cliente no encontrado.</p>
        </div>
        <!-- Dialog Modal -->
        <Dialog header="Seleccionar Opción" v-model:visible="showDialog" :modal="true" :closable="false">
            <Dropdown v-model="selectedOption" :options="options" option-label="label" option-value="value" placeholder="Seleccione una opción" class="w-full mb-3" />
            <Dropdown v-if="selectedOption === 'parcial' || selectedOption === 'no_entregado'" v-model="selectedMotivo" :options="motivos" option-label="label" option-value="value" placeholder="Seleccione un motivo" class="w-full mb-3" />
            <InputText v-if="selectedMotivo && (selectedOption === 'parcial' || selectedOption === 'no_entregado')" v-model="comment" placeholder="Ingrese los comentarios aquí..." rows="3" class="w-full mb-3" />
            <div class="flex justify-content-end">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="showDialog = false" />
                <Button label="Aceptar" icon="pi pi-check" class="p-button-text" @click="handleDialogConfirm" />
            </div>
        </Dialog>
    </div>
</template>

<script>
function handleInput(data) {
    const originalValue = data.entregado;
    data.entregado = data.entregado.replace(/\D/g, '');

    if (originalValue !== data.entregado) {
        Swal.fire('Error', 'Solo se deben ingresar números.', 'error');
    } else if (parseInt(data.entregado) > data.FKIMG || parseInt(data.entregado) < 0) {
        Swal.fire('Error', 'El valor de entregado debe ser igual o menor que la cantidad y mayor o igual a 0.', 'error');
        data.entregado = originalValue; // Revertir al valor original si no cumple la validación
    }
}
</script>

<style scoped>
.small-input {
    width: 60px;
    padding: 5px;
}
</style>