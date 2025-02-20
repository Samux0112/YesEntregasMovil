<script setup>
import { useAuthStore } from "@/api-plugins/authStores";
import { useLayout } from "@/layout/composables/layout";
import axios from "axios";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
const { showAlert } = useLayout();
// Accede al router
const router = useRouter();

// Accede al store de autenticación
const authStore = useAuthStore();

// Obtén el nombre de usuario y la ruta del store correctamente
const username = computed(() => authStore.user?.Nombre || "Invitado");
const ruta = computed(() => authStore.user?.Username || "No existe la ruta");

// Manejo de fecha y hora actual
const fechaHoraActual = ref("");
const mensajeBienvenida = ref(""); // Aquí almacenamos el mensaje de la API
const mensajeIndicativo = ref(""); // Nueva variable para el mensaje indicativo
const mensajeFinalDia = ref(""); // Variable para el mensaje de finalización del día
const mensajeMostrar = ref(""); // Mensaje para mostrar en la pantalla
const clientesPendientes = ref(0); // Contador de clientes pendientes
const totalKgsGlobal = ref(0); // Peso total de todas las entregas

// Leer el estado de mute desde el store
const isMuted = computed(() => authStore.isMuted);

// Función para actualizar la fecha y hora cada segundo
const actualizarFechaHora = () => {
  const now = new Date();
  const opciones = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // Habilitar el formato de 12 horas con AM/PM
  };
  fechaHoraActual.value = now.toLocaleString("es-ES", opciones);
};

// Función para obtener el mensaje de bienvenida desde la API y personalizarlo
const obtenerMensajeBienvenida = async () => {
  try {
    const response = await axios.post(
      "https://calidad-yesentregas-api.yes.com.sv/etiquetas/",
      {
        param: "msg_audible_resum",
      }
    );

    if (response.data && response.data.length > 0) {
      let mensaje = response.data[0].valor;
      // Reemplazar las variables en el mensaje
      mensaje = mensaje.replace("[Carlos]", username.value);
      mensaje = mensaje.replace("[SUP001]", ruta.value);
      mensaje = mensaje.replace("[48]", clientesPendientes.value);
      mensaje = mensaje.replace("[1800]", totalKgsGlobal.value);
      mensajeBienvenida.value = mensaje;
    } else {
      mensajeBienvenida.value = "Mensaje no encontrado";
    }
  } catch (error) {
    console.error("Error al obtener el mensaje:", error);
    mensajeBienvenida.value = "Error al cargar el mensaje de bienvenida";
  }
};

// Función para obtener el mensaje indicativo desde la API
const obtenerMensajeIndicativo = async () => {
  try {
    const response = await axios.post(
      "https://calidad-yesentregas-api.yes.com.sv/etiquetas/",
      {
        param: "msg_info",
      }
    );

    if (response.data && response.data.length > 0) {
      mensajeIndicativo.value = response.data[0].valor;
    } else {
      mensajeIndicativo.value = "Mensaje no encontrado";
    }
  } catch (error) {
    console.error("Error al obtener el mensaje indicativo:", error);
    mensajeIndicativo.value = "Error al cargar el mensaje indicativo";
  }
};

// Función para obtener el mensaje de finalización del día desde la API
const obtenerMensajeFinalDia = async () => {
  try {
    const response = await axios.post(
      "https://calidad-yesentregas-api.yes.com.sv/etiquetas/",
      {
        param: "msg_final_dia",
      }
    );

    if (response.data && response.data.length > 0) {
      mensajeFinalDia.value = response.data[0].valor;
    } else {
      mensajeFinalDia.value = "Mensaje no encontrado";
    }
  } catch (error) {
    console.error("Error al obtener el mensaje final del día:", error);
    mensajeFinalDia.value = "Error al cargar el mensaje final del día";
  }
};

// Función para cargar clientes y contar los pendientes
const cargarClientesPendientes = async () => {
  try {
    const response = await axios.post(
      "https://calidad-yesentregas-api.yes.com.sv/clientes/",
      {
        sortl: username.value,
      }
    );

    if (response.data && response.data.length > 0) {
      const clientesConEstado = response.data.map((cliente) => ({
        ...cliente,
        estado: cliente.estado || "pendiente", // Asignar estado inicial como pendiente si no existe
      }));
      localStorage.setItem("clientes", JSON.stringify(clientesConEstado));
      localStorage.setItem("ultimaCargaClientes", new Date().toISOString()); // Guardar la fecha de la última carga
      clientesPendientes.value = clientesConEstado.filter(
        (cliente) => cliente.estado === "pendiente"
      ).length;
    } else {
      clientesPendientes.value = 0;
      showAlert({
        title: "Sin clientes",
        text: "No se encontraron clientes para el usuario proporcionado.",
        icon: "info",
        confirmButtonText: "Entendido",
      });
    }
  } catch (error) {
    console.error("Error al cargar los clientes:", error);
    clientesPendientes.value = 0;
    showAlert({
      title: "Error",
      text: "Hubo un problema al cargar los clientes.",
      icon: "error",
      confirmButtonText: "Entendido",
    });
  }
};

// Función para obtener el peso total de todas las entregas
const obtenerTotalKgsGlobal = async () => {
  try {
    const response = await axios.post(
      "https://calidad-yesentregas-api.yes.com.sv/entregas/",
      {
        bzirk: username.value,
      }
    );

    if (response.data && response.data.length > 0) {
      totalKgsGlobal.value = response.data
        .reduce((acc, item) => acc + item.KGS, 0)
        .toFixed(2);
    } else {
      totalKgsGlobal.value = 0;
    }
  } catch (error) {
    console.error(
      "Error al obtener el peso total de todas las entregas:",
      error
    );
    totalKgsGlobal.value = 0;
  }
};

// Función para redirigir a la vista de entregas
const handleEntrega = () => {
  authStore.registrarAccion("Iniciar entregas");
  router.push("/clientes"); // Redirige a la ruta de entregas
};

// Función para verificar y cargar clientes
const verificarYcargarClientes = async () => {
  const ultimaCarga = localStorage.getItem("ultimaCargaClientes");
  const ahora = new Date().toISOString();
  const diferencia = new Date(ahora) - new Date(ultimaCarga);

  // Si la última carga fue hace más de 24 horas, recargar los clientes
  if (!ultimaCarga || diferencia > 24 * 60 * 60 * 1000) {
    await cargarClientesPendientes();
  } else {
    const clientesGuardados = JSON.parse(localStorage.getItem("clientes"));
    if (clientesGuardados) {
      clientesPendientes.value = clientesGuardados.filter(
        (cliente) => cliente.estado === "pendiente"
      ).length;
    }
  }
};

// Función para verificar si el día está finalizado y mostrar el mensaje
const verificarFinalizacionDia = () => {
  const dayFinished = localStorage.getItem("dayFinished");
  if (dayFinished === "true") {
    mensajeMostrar.value = mensajeFinalDia.value;
  } else {
    mensajeMostrar.value = mensajeBienvenida.value;
  }
  authStore.hablarMensaje(mensajeMostrar.value);
};

// Actualizar la fecha y hora cada segundo
onMounted(async () => {
  actualizarFechaHora();
  setInterval(actualizarFechaHora, 1000);
  // Verificar y cargar clientes pendientes
  await verificarYcargarClientes();
  // Obtener el peso total de todas las entregas
  await obtenerTotalKgsGlobal();
  // Obtener los mensajes al montar el componente
  await obtenerMensajeBienvenida();
  await obtenerMensajeIndicativo();
  await obtenerMensajeFinalDia();
  // Verificar si el día está finalizado y establecer el mensaje a mostrar
  verificarFinalizacionDia();
});

// Observar cambios en isMuted para detener el habla instantáneamente
watch(isMuted, (newVal) => {
  if (newVal) {
    authStore.detenerHabla();
  }
});
</script>
<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12 text-center">
      <!-- Mensaje principal -->
      <h1 class="text-3xl font-bold">
        {{ mensajeMostrar || "Cargando mensaje..." }}
      </h1>
      <br />
      <p class="text-xl mt-4">
        Usuario: <span class="text-primary font-semibold">{{ username }}</span>
      </p>
      <p class="text-xl mt-4">
        Ruta: <span class="text-primary font-semibold">{{ ruta }}</span>
      </p>
      <br />
      <!-- Mensaje indicativo -->
      <p class="text-xl mt-4">
        {{ mensajeIndicativo || "Cargando mensaje indicativo..." }}
      </p>
      <br />
      <!-- Botón de inicio de día -->
      <Button
        label="Ver clientes"
        class="w-auto p-2 text-sm"
        @click="handleEntrega"
      ></Button>
      <br />
      <!-- Fecha y hora -->
      <p class="text-xl mt-8">
        <span class="text-secondary font-semibold">{{ fechaHoraActual }}</span>
      </p>
      <br />
    </div>
  </div>
</template>