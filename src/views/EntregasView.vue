<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute(); // Usamos useRoute para acceder a los parámetros de la URL
const cliente = ref(null); // Variable para almacenar el cliente seleccionado

onMounted(() => {
    // Recuperar el cliente desde localStorage
    const clienteGuardado = JSON.parse(localStorage.getItem('clienteSeleccionado'));

    // Si no hay cliente en localStorage, buscamos con el id de la URL
    if (!clienteGuardado) {
        const clienteId = route.params.id; // Obtener el id del cliente desde la URL
        const clientesGuardados = JSON.parse(localStorage.getItem('clientes') || '[]');
        cliente.value = clientesGuardados.find(c => String(c.KUNNR) === clienteId); // Buscar el cliente en la lista cargada
    } else {
        cliente.value = clienteGuardado; // Usar el cliente guardado en localStorage
    }
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
        </div>
        <div v-else>
            <p>Cliente no encontrado.</p>
        </div>
    </div>
</template>
