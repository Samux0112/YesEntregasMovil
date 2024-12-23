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
  <div class="card">
    <div class="font-semibold text-xl mb-4">Logs</div>
    <DataTable
      :value="logs"
      :paginator="true"
      :rows="10"
      dataKey="id"
      :rowHover="true"
      showGridlines
    >
      <template #header>
        <div class="flex justify-between">
          <!-- Eliminar el botón y campo de búsqueda -->
        </div>
      </template>
      <template #empty>No se encontraron registros.</template>
      <template #loading>Cargando logs, por favor espere.</template>
      
      <!-- ID secuencial -->
      <Column header="ID" style="min-width: 6rem">
        <template #body="{ index }">
          {{ index + 1 }}
        </template>
      </Column>

      <!-- Acción (mostrar 'login') -->
      <Column field="accion" header="Acción" style="min-width: 10rem">
        <template #body="{ data }">
          {{ data.accion || 'login' }} <!-- Asegúrate de que este campo esté en tu JSON -->
        </template>
      </Column>

      <!-- Aplicado -->
      <Column field="aplicado" header="Aplicado" style="min-width: 10rem">
        <template #body="{ data }">
          {{ data.aplicado }}
        </template>
      </Column>

      <!-- JSON Completo -->
      <Column header="JSON Completo" style="min-width: 20rem">
        <template #body="{ data }">
          <pre>{{ data.json_accion ? data.json_accion : 'No disponible' }}</pre>
        </template>
      </Column>

    </DataTable>
  </div>
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) {
  font-weight: bold;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
  font-weight: bold;
}
</style>
