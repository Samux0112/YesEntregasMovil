<script setup>
import { onMounted, ref } from 'vue';
import { getLogsFromLocalStorage } from '../api-plugins/entregaService'; // Ajusta la ruta según corresponda

// Referencia para los logs
const logs = ref([]); // Estado para almacenar los logs obtenidos

// Función para cargar los logs desde localStorage
const cargarLogs = async () => {
  try {
    // Obtener logs de localStorage
    const logsObtenidos = await getLogsFromLocalStorage();
    logs.value = logsObtenidos; // Almacenar los logs en el estado
  } catch (error) {
    console.error('Error al cargar los logs:', error);
  }
};

// Cargar los logs al montar el componente
onMounted(async () => {
  await cargarLogs();
});
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12 text-center">
      <h1 class="text-3xl font-bold">Logs de Actividad</h1>

      <!-- Si hay logs, los mostramos en la tabla -->
      <div v-if="logs.length > 0">
        <table class="min-w-full table-auto border-collapse">
          <thead class="bg-gray-100">
            <tr>
              <th class="border p-2">ID</th>
              <th class="border p-2">Acción</th>
              <th class="border p-2">Aplicado</th>
              <th class="border p-2">JSON Completo</th> <!-- Nueva columna para mostrar el JSON completo -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="border p-2">{{ log.id }}</td>
              <td class="border p-2">
                <!-- Solo hacemos JSON.parse si es necesario -->
                {{ typeof log.json_accion === 'string' ? JSON.parse(log.json_accion).accion : log.json_accion.accion }}
              </td>
              <td class="border p-2">{{ log.aplicado }}</td>
              <td class="border p-2">
                <!-- Mostramos el JSON completo usando JSON.stringify -->
                <pre>{{ JSON.stringify(log, null, 2) }}</pre>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Si no hay logs, mostramos un mensaje -->
      <div v-else>
        <p>No se han encontrado logs.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 12px;
  border: 1px solid #ddd;
}

th {
  background-color: #f4f4f4;
}

pre {
  white-space: pre-wrap; /* Permite que el JSON largo se ajuste al tamaño de la celda */
  word-wrap: break-word; /* Para evitar desbordes */
  background-color: #f0f0f0; /* Fondo gris para resaltar el JSON */
  padding: 10px;
  border-radius: 4px;
}
</style>
