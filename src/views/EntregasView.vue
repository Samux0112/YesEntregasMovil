<script setup>
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
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

// Filtros
const filters = ref({
  global: { value: '', matchMode: 'contains' },
  accion: { value: '', matchMode: 'contains' },
  aplicado: { value: '', matchMode: 'contains' },
});

const loading = ref(false);

// Limpiar filtros
const clearFilter = () => {
  filters.value = {
    global: { value: '', matchMode: 'contains' },
    accion: { value: '', matchMode: 'contains' },
    aplicado: { value: '', matchMode: 'contains' },
  };
};
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
      v-model:filters="filters"
      filterDisplay="menu"
      :loading="loading"
      :filters="filters"
      :globalFilterFields="['accion', 'aplicado']"
      showGridlines
    >
      <template #header>
        <div class="flex justify-between">
          <Button type="button" icon="pi pi-filter-slash" label="Limpiar filtro" outlined @click="clearFilter" />
          <div>
            <InputText v-model="filters['global'].value" placeholder="Buscar palabra clave" />
          </div>
        </div>
      </template>
      <template #empty>No se encontraron registros.</template>
      <template #loading>Cargando logs, por favor espere.</template>
      
      <Column field="id" header="ID" style="min-width: 6rem">
        <template #body="{ data }">
          {{ data.id }}
        </template>
      </Column>
      
      <Column field="accion" header="Acción" style="min-width: 10rem">
        <template #body="{ data }">
          {{ data.accion }}
        </template>
      </Column>

      <Column field="aplicado" header="Aplicado" style="min-width: 10rem">
        <template #body="{ data }">
          {{ data.aplicado }}
        </template>
      </Column>

      <Column field="jsonCompleto" header="JSON Completo" style="min-width: 20rem">
        <template #body="{ data }">
          <pre>{{ data.jsonCompleto }}</pre>
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
