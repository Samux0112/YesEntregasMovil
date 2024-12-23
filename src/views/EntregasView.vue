<script setup>
import { getLogs } from '@/api-plugins/entregaService'; // Importar la función para obtener los logs
import { onMounted, ref } from 'vue';

const logs = ref([]); // Estado para almacenar los logs obtenidos

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

<<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12 text-center">
      <h1 class="text-3xl font-bold">Logs de Actividad</h1>

      <!-- Si hay logs, los mostramos en la tabla -->
      <div v-if="logs.length > 0">
        <table class="table-auto border-collapse w-full">
          <thead>
            <tr>
              <th class="border p-2">ID</th>
              <th class="border p-2">Acción</th>
              <th class="border p-2">Aplicado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="border p-2">{{ log.id }}</td>
              <td class="border p-2">{{ log.json_accion }}</td>
              <td class="border p-2">{{ log.aplicado }}</td>
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
  border: 1px solid #ddd;
  text-align: left;
  padding: 8px;
}

th {
  background-color: #f4f4f4;
}
</style>
