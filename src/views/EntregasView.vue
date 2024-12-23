<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import { getLogs } from '@/api-plugins/entregaService'; // Importar las funciones
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router'; // Importar el router

const router = useRouter();
const authStore = useAuthStore();

const logs = ref([]); // Estado para almacenar los logs obtenidos
const filters = ref({}); // Filtros para la tabla

// Función para cargar los logs desde la base de datos
const cargarLogs = async () => {
  try {
    const logsObtenidos = await getLogs();
    logs.value = logsObtenidos; // Almacenar los logs en el estado
  } catch (error) {
    console.error('Error al cargar los logs:', error);
  }
};

onMounted(() => {
  // Cargar los logs cuando se monta el componente
  cargarLogs();
});
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12 text-center">
      <h1 class="text-3xl font-bold">Logs de Actividad</h1>

      <!-- DataTable de PrimeVue para mostrar los logs -->
      <DataTable :value="logs" paginator :rows="10" :filters="filters" dataKey="id" :rowHover="true" showGridlines>
        <template #header>
          <div class="flex justify-between">
            <InputText v-model="filters['global'].value" placeholder="Buscar logs..." class="p-inputtext-sm" />
          </div>
        </template>

        <!-- Columnas de la tabla -->
        <Column field="Accion" header="Acción" :filter="true" :showFilterMatchModes="false" style="min-width: 12rem">
          <template #body="{ data }">
            {{ JSON.parse(data.json_accion).Accion }}
          </template>
        </Column>

        <Column field="fecha-hora" header="Fecha y hora" :filter="true" style="min-width: 12rem">
          <template #body="{ data }">
            {{ JSON.parse(data.json_accion)['fecha-hora'] }}
          </template>
        </Column>

        <Column field="Username" header="Usuario" :filter="true" style="min-width: 10rem">
          <template #body="{ data }">
            {{ JSON.parse(data.json_accion).Username }}
          </template>
        </Column>

        <Column field="latitud" header="Latitud" :filter="true" style="min-width: 10rem">
          <template #body="{ data }">
            {{ JSON.parse(data.json_accion).latitud }}
          </template>
        </Column>

        <Column field="longitud" header="Longitud" :filter="true" style="min-width: 10rem">
          <template #body="{ data }">
            {{ JSON.parse(data.json_accion).longitud }}
          </template>
        </Column>

      </DataTable>
    </div>
  </div>
</template>

