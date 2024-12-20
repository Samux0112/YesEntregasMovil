<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import { getLogs } from '@/api-plugins/entregaService'; // Importar las funciones
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router'; // Importar el router

const router = useRouter();
const authStore = useAuthStore();

const logs = ref([]); // Estado para almacenar los logs obtenidos

// Función para cargar los logs desde la base de datos local
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
      <div v-if="logs.length > 0">
        <div v-for="log in logs" :key="log.id" class="p-4 border mb-4">
          <h2 class="text-xl font-semibold">Acción: {{ JSON.parse(log.json_accion).Accion }}</h2>
          <p><strong>Fecha y hora:</strong> {{ JSON.parse(log.json_accion)['fecha-hora'] }}</p>
          <p><strong>Usuario:</strong> {{ JSON.parse(log.json_accion).Username }}</p>
          <p><strong>Latitud:</strong> {{ JSON.parse(log.json_accion).latitud }}</p>
          <p><strong>Longitud:</strong> {{ JSON.parse(log.json_accion).longitud }}</p>
        </div>
      </div>
      <div v-else>
        <p>No se han encontrado logs.</p>
      </div>
    </div>
    <!-- <div class="card">
        <div class="font-semibold text-xl mb-4">Filtros</div>
        <DataTable
            :value="Logs"
            :paginator="true"
            :rows="10"
            dataKey="id"
            :rowHover="true"
            v-model:filters="filters1"
            filterDisplay="menu"
            :loading="loading1"
            :filters="filters1"
            showGridlines
        >
            <template #header>
                <div class="flex justify-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters1['global'].value" placeholder="Keyword Search" />
                    </IconField>
                </div>
            </template>
            <template #empty> No customers found. </template>
            <template #loading> Loading customers data. Please wait. </template>
             Inician las columnas de la table
            <Column header="Acción" field="accion" :showFilterMatchModes="false" :filterMenuStyle="{ width: '14rem' }" style="min-width: 14rem">
                <template #body="{ data }">
                    {{ data.accion }}
                </template>
            </Column>
            <Column header="Fecha y hora" filterField="fecha_hora" dataType="date" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ formatDate(data.fecha_hora) }}
                </template>
                <template #filter="{ filterModel }">
                    <DatePicker v-model="filterModel.value" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
                </template>
            </Column>
            <Column header="Usuario" filterField="usuario" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.usuario }}
                </template>
            </Column>
            <Column header="Latitud" filterField="latitud" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.latitud }}
                </template>
            </Column>
            <Column header="Longitud" filterField="longitud" style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.longitud }}
                </template>
            </Column>
        </DataTable>
    </div> -->

  </div>
</template>
