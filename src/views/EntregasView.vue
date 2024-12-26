<script setup>
import { useAuthStore } from '@/api-plugins/authStores'; // Importa tu store de autenticación
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute(); // Usamos useRoute para acceder a los parámetros de la URL
const cliente = ref(null); // Variable para almacenar el cliente seleccionado
const arktxList = ref([]); // Lista para almacenar todos los ARKTX y FKIMG
const loading = ref(false); // Indicador de carga
const authStore = useAuthStore(); // Accedemos al store de autenticación
const username = computed(() => authStore.user?.Username); // Obtener el username del store

// Recuperar el cliente desde localStorage o buscarlo con el id de la URL
const cargarCliente = () => {
    const clienteGuardado = JSON.parse(localStorage.getItem('clienteSeleccionado'));

    if (!clienteGuardado) {
        const clienteId = route.params.id; // Obtener el id del cliente desde la URL
        const clientesGuardados = JSON.parse(localStorage.getItem('clientes') || '[]');
        cliente.value = clientesGuardados.find(c => String(c.KUNNR) === clienteId); // Buscar el cliente en la lista cargada
        console.log('Cliente cargado desde URL:', cliente.value);
    } else {
        cliente.value = clienteGuardado; // Usar el cliente guardado en localStorage
        console.log('Cliente cargado desde localStorage:', cliente.value);
    }
};

// Función para limpiar los valores y eliminar caracteres no deseados
const limpiarValor = (valor) => {
    return String(valor).replace(/[^\x20-\x7E]/g, '').trim(); // Elimina caracteres no imprimibles y espacios
};

const cargarProductosDesdeAPI = async () => {
    if (cliente.value && username.value) {
        loading.value = true; // Indicamos que estamos cargando los productos
        try {
            const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/entregas/', {
                bzirk: username.value // Enviar el username como parámetro bzirk
            });

            console.log('Respuesta de la API:', response.data); // Log para ver la respuesta completa

            // Verificamos si el cliente KUNNR coincide con KUNNAG
            const entregas = response.data;

            // Limpiar los valores de KUNNR y KUNAG antes de compararlos
            const entregasCliente = entregas.filter(entrega => {
                const kunag = limpiarValor(entrega.KUNAG); // Limpiar KUNAG
                const kunnr = limpiarValor(cliente.value.KUNNR); // Limpiar KUNNR

                // Log para verificar los valores que estamos comparando
                console.log(`Comparando KUNAG: "${kunag}" con KUNNR: "${kunnr}"`);

                return kunag === kunnr; // Comparar después de limpiar
            });

            if (entregasCliente.length > 0) {
                // Almacenamos todos los ARKTX y FKIMG que coinciden con el cliente en arktxList
                arktxList.value = entregasCliente.map(entrega => ({
                    ARKTX: entrega.ARKTX,
                    FKIMG: parseFloat(entrega.FKIMG) // Asegúrate de que FKIMG se maneje como número de punto flotante
                }));
                localStorage.setItem(`productos_${cliente.value.KUNNR}`, JSON.stringify(arktxList.value));
                console.log('Productos guardados en localStorage:', arktxList.value);
            } else {
                console.log('No se encontró coincidencia entre KUNNR y KUNNAG');
            }
        } catch (error) {
            console.error('Error al obtener entregas:', error);
        } finally {
            loading.value = false; // Terminamos la carga
        }
    }
};

// Cargar el cliente y los productos guardados en localStorage cuando se monte el componente
const cargarProductosDesdeLocalStorage = () => {
    const productosGuardados = JSON.parse(localStorage.getItem(`productos_${cliente.value.KUNNR}`));
    if (productosGuardados) {
        arktxList.value = productosGuardados;
        console.log('Productos cargados desde localStorage:', arktxList.value);
    }
};

// Llamar a la función para cargar el cliente y los productos cuando se monte el componente
onMounted(() => {
    cargarCliente();
    cargarProductosDesdeAPI();
    cargarProductosDesdeLocalStorage();
});
</script>
<template>
    <div>
        <h1>Entregas</h1>
        <div v-if="cliente">
            <p><strong>Nombre:</strong> {{ cliente.NAME1 }} {{ cliente.NAME2 }}</p>
            <p><strong>Dirección:</strong> {{ cliente.STRAS }}</p>
            <p><strong>Latitud:</strong> {{ cliente.LATITUD }}</p>
            <p><strong>Longitud:</strong> {{ cliente.LONGITUD }}</p>

            <div v-if="arktxList.length > 0">
                <p><strong>Productos:</strong></p>
                <ul>
                    <li v-for="(producto, index) in arktxList" :key="index">
                        <p><strong>ARKTX:</strong> {{ producto.ARKTX }}</p>
                        <p><strong>FKIMG:</strong> {{ producto.FKIMG }}</p>
                    </li>
                </ul>
            </div>
            <div v-else>
                <p>No se encontraron productos para este cliente.</p>
            </div>
        </div>
        <div v-else>
            <p>Cliente no encontrado.</p>
        </div>
    </div>
</template>