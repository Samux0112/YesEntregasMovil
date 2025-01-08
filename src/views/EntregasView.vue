<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import axios from 'axios';
import Swal from 'sweetalert2';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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

// Variables para jabas, palets y KGS
const numeroJabas = ref(0);
const numeroPalets = ref(0);
const totalKgs = ref(0);

// Función para obtener el número de jabas y palets desde la API
const obtenerJabasYPallets = async (vbeln) => {
    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/control-cestas/', {
            vbeln: vbeln,
            start_date: null,
            end_date: null
        });

        if (response.data && response.data.length > 0) {
            const salidas = response.data.filter(item => item.tipo_mov === 'S');
            numeroJabas.value = salidas.reduce((acc, item) => acc + item.cantidad, 0);
            numeroPalets.value = salidas.reduce((acc, item) => acc + item.cantidad_palets, 0);
        } else {
            numeroJabas.value = 0;
            numeroPalets.value = 0;
        }
    } catch (error) {
        console.error('Error al obtener el número de jabas y palets:', error);
        numeroJabas.value = 0;
        numeroPalets.value = 0;
    }
};

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

// Función para verificar la distancia antes de permitir la entrega
const verificarDistancia = () => {
    // Obtener la ubicación del usuario desde el localStorage
    const userLocation = JSON.parse(localStorage.getItem('location')) || { latitude: 0, longitude: 0 };
    const userLat = parseFloat(userLocation.latitude);
    const userLon = parseFloat(userLocation.longitude);

    // Calcular la distancia entre el usuario y el cliente
    const clienteLat = parseFloat(cliente.value.LATITUD);
    const clienteLon = parseFloat(cliente.value.LONGITUD);

    console.log(`Calculando distancia entre usuario y cliente: (${userLat}, ${userLon}) y (${clienteLat}, ${clienteLon})`);

    const distancia = calcularDistancia(clienteLat, clienteLon, userLat, userLon);

    if (distancia > 100) {
        Swal.fire({
            title: 'Advertencia',
            text: 'Estás a más de 100 metros del cliente. No puedes realizar la entrega.',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return false; // No permitir la entrega
    }
    return true; // Permitir la entrega
};

// Función para manejar la entrega
const handleEntregar = () => {
    if (verificarDistancia()) {
        showDialog.value = true;
    }
};

// Funciones
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
            estadoCliente = 'entregado';
            actualizarClientes(estadoCliente);
            Swal.fire('Entregado', 'Todos los productos han sido entregados.', 'success').then(() => {
                router.push('/clientes'); // Redirige al menú de clientes
            });
        } catch (error) {
            console.error('Error al actualizar la entrega:', error);
            Swal.fire('Error', 'Hubo un error al actualizar la entrega.', 'error');
        }
        
        // Llamar a registrarEntrega en el authStore con kunnag y vbeln
        if (arktxList.value.length > 0) {
            const kunnag = cliente.value.KUNNR;
            const vbeln = arktxList.value[0].VBELN;
            await authStore.registrarEntrega(kunnag, vbeln);
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

                estadoCliente = 'no_entregado';
                actualizarClientes(estadoCliente);
                Swal.fire('Guardado', 'Los datos han sido guardados.', 'success').then(() => {
                    router.push('/clientes'); // Redirige al menú de clientes
                });
            } else {
                estadoCliente = 'parcial';
                actualizarClientes(estadoCliente);
                Swal.fire('Guardado', 'Los datos han sido guardados.', 'success').then(() => {
                    arktxList.value.forEach(item => item.editable = true); // Activar edición de productos
                });
            }
        } catch (error) {
            console.error('Error al actualizar el complemento:', error);
            Swal.fire('Error', 'Hubo un error al actualizar el complemento.', 'error');
        }
        
        // Llamar a registrarEntrega en el authStore con kunnag y vbeln
        if (arktxList.value.length > 0) {
            const kunnag = cliente.value.KUNNR;
            const vbeln = arktxList.value[0].VBELN;
            await authStore.registrarEntrega(kunnag, vbeln);
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
// Manejar la confirmación de productos entregados
const handleConfirmAll = async () => {
    // Validar todas las entradas antes de proceder
    const invalidItems = arktxList.value.filter(item => {
        const entregado = parseInt(item.entregado);
        return isNaN(entregado) || entregado > item.FKIMG || entregado < 0;
    });

    if (invalidItems.length > 0) {
        Swal.fire('Error', 'Hay cantidades ingresadas que son inválidas. Por favor corrígelas antes de confirmar.', 'error');
        return; // No proceder si hay entradas inválidas
    }

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
function handleInput(data) {
    const originalValue = data.entregado;
    data.entregado = data.entregado.replace(/\D/g, '');

    if (originalValue !== data.entregado) {
        Swal.fire('Error', 'Solo se deben ingresar números.', 'error');
    } else if (parseInt(data.entregado) > data.FKIMG || parseInt(data.entregado) < 0) {
        Swal.fire('Error', 'El valor de entregado debe ser igual o menor que la cantidad y mayor o igual a 0.', 'error');
        data.entregado = originalValue; // Revertir al valor original si no cumple la validación
    } else {
        data.edited = true; // Marcar como editado
    }
}

// Manejar la edición de la cantidad entregada
const handleConfirm = (item) => {
    item.editable = false;
    // Eliminar valor anterior y aceptar el nuevo
    localStorage.setItem(`productos_${cliente.value.KUNNR}`, JSON.stringify(arktxList.value));
};

// Recuperar el cliente desde localStorage o buscarlo con el id de la URL
const cargarCliente = async () => {
    const clienteGuardado = JSON.parse(localStorage.getItem('clienteSeleccionado'));

    if (!clienteGuardado) {
        const clienteId = route.params.id;
        try {
            const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/clientes/', {
                kunnr: clienteId
            });

            if (response.data && response.data.length > 0) {
                cliente.value = response.data[0];
                console.log('Cliente cargado desde API:', cliente.value);
                localStorage.setItem('clienteSeleccionado', JSON.stringify(cliente.value));
            } else {
                console.error('Cliente no encontrado en la API.');
                cliente.value = null;
            }
        } catch (error) {
            console.error('Error al cargar el cliente desde la API:', error);
            cliente.value = null;
        }
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
                    KGS: entrega.KGS,
                    entregado: entrega.FKIMG, // Inicializar con la misma cantidad
                    editable: false, // Inicialmente no editable
                    edited: false // Inicialmente no editado
                }));
                localStorage.setItem(`productos_${cliente.value.KUNNR}`, JSON.stringify(arktxList.value));
                console.log('Productos guardados en localStorage:', arktxList.value);

                // Llamar a obtenerJabasYPallets con el VBELN de la primera entrega
                obtenerJabasYPallets(entregasCliente[0].VBELN);

                // Sumar los KGS de todas las entregas del cliente y limitar a 2 decimales
                totalKgs.value = arktxList.value.reduce((acc, item) => acc + item.KGS, 0).toFixed(2);
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
                value: motivo.id,
                id_tipo: motivo.id_tipo // Agregar id_tipo para filtrado
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
        if (newValue === 'parcial') {
            motivos.value = motivos.value.filter(motivo => motivo.id_tipo === 1);
        } else if (newValue === 'no_entregado') {
            motivos.value = motivos.value.filter(motivo => motivo.id_tipo === 2);
        }
    }
});

// Inicializar el monitoreo de la ubicación
const startLocationWatch = () => {
    if ('geolocation' in navigator) {
        const successCallback = (position) => {
            const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            localStorage.setItem('location', JSON.stringify(newLocation));
            console.log('Ubicación actualizada:', newLocation);
        };

        const errorCallback = (error) => {
            console.error('Error al obtener la ubicación:', error.message);
        };

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        navigator.geolocation.watchPosition(successCallback, errorCallback, options);
    } else {
        console.error('Geolocalización no soportada por el navegador');
        Swal.fire({
            title: 'Error',
            text: 'Geolocalización no soportada por el navegador',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
};
// Añadir propiedad searchQuery
const searchQuery = ref('');

// Computed para filtrar arktxList
const filteredArktxList = computed(() => {
    return arktxList.value.filter(item => 
        item.ARKTX.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});
const rowClass = (data) => {
    return {
        'edited-row': data.edited
    };
};
onMounted(() => {
    cargarCliente();
    cargarProductosDesdeAPI();
    cargarProductosDesdeLocalStorage();
    startLocationWatch(); // Iniciar el monitoreo de la ubicación
});
</script>
<template>
    <div>
        <div v-if="cliente">
            <DataTable :value="filteredArktxList" :paginator="true" :rows="10" dataKey="id" :rowHover="true"
                filterDisplay="menu" :loading="loading" showGridlines>
                <template #header>
                    <div>
                        <div class="font-semibold text-l">Cliente: {{ cliente.NAME1 }}</div>
                        <div class="font-semibold text-l">({{ cliente.NAME2 }})</div>
                        <div class="flex">
                            <div class="font-semibold text-l">{{ cliente.KUNNR }}</div>
                            <div class="font-semibold text-l ml-2" v-if="arktxList.length > 0"> Dui: {{
                                arktxList[0].VBELN }}</div>
                        </div>
                        <div class="flex">
                            <div class="font-semibold text-l">Items: {{ totalItems }}</div>
                            <div class="font-semibold text-l ml-2">Total: {{ totalCantidad }}</div>
                        </div>
                        <div class="flex">
                            <div class="font-semibold text-l"># de JABAS: {{ numeroJabas }}</div>
                            <div class="font-semibold text-l ml-2"># de PALETS: {{ numeroPalets }}</div>
                        </div>
                        <div class="flex">
                            <div class="font-semibold text-l">Total KG: {{ totalKgs }}</div>
                            <div class="font-semibold text-l ml-2">Comentario: {{ cliente.COMENTARIO }}</div>
                        </div>
                    </div>
                    <div class="flex">
                        <div><Button label="Entregar" icon="pi pi-check" @click="handleEntregar" /></div>
                        <div class="ml-2">
                            <InputText v-model="searchQuery" placeholder="Buscar por descripcion"/>
                        </div>
                    </div>
                </template>
                <template #empty> No se encontraron productos </template>
                <template #loading> Cargando productos, por favor espere. </template>
                <Column field="ARKTX" header="Descripción" style="min-width: 5rem">
    <template #body="slotProps">
        <div :class="{ 'edited-row': slotProps.data.edited }" class="cell-content">
            {{ slotProps.data.ARKTX }}
        </div>
    </template>
</Column>
<Column field="FKIMG" header="Cantidad" style="min-width: 5rem">
    <template #body="slotProps">
        <div :class="{ 'edited-row': slotProps.data.edited }" class="cell-content">
            {{ slotProps.data.FKIMG }}
        </div>
    </template>
</Column>
<Column field="entregado" style="min-width: 5rem">
    <template #header>
                        <div class="flex justify-between items-center">
                            <Button v-if="showConfirmButton" icon="pi pi-check" class="ml-2"
                                @click="handleConfirmAll" />
                        </div>
                    </template>
    <template #body="slotProps">
        <div :class="{ 'edited-row': slotProps.data.edited }" class="cell-content flex items-center">
            <InputText v-model="slotProps.data.entregado" class="small-input"
                :disabled="!slotProps.data.editable" @input="handleInput(slotProps.data)" />
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
            <Dropdown v-model="selectedOption" :options="options" option-label="label" option-value="value"
                placeholder="Seleccione una opción" class="w-full mb-3" />
            <Dropdown v-if="selectedOption === 'parcial' || selectedOption === 'no_entregado'" v-model="selectedMotivo"
                :options="motivos" option-label="label" option-value="value" placeholder="Seleccione un motivo"
                class="w-full mb-3" />
            <InputText v-if="selectedMotivo && (selectedOption === 'parcial' || selectedOption === 'no_entregado')"
                v-model="comment" placeholder="Ingrese los comentarios aquí..." rows="3" class="w-full mb-3" />
            <div class="flex justify-content-end">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="showDialog = false" />
                <Button label="Aceptar" icon="pi pi-check" class="p-button-text" @click="handleDialogConfirm" />
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.small-input {
    width: 60px;
    padding: 5px;
}

.edited-row {
    background-color: #b62121; /* Color rojo claro o pastel para las celdas editadas */
}
</style>