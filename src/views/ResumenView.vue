<script>
import { useAuthStore } from "@/api-plugins/authStores"; // Asegúrate de importar tu authStore
import { useLayout } from "@/layout/composables/layout";
import axios from "axios"; // Asegúrate de importar axios
//import Highcharts from "highcharts"; // Asegúrate de tener Highcharts importado
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

export default {
  setup() {
    const { getPrimary, isDarkTheme, showAlert } = useLayout();
    const router = useRouter();
    const authStore = useAuthStore();

    const chartOptions = ref({
      chart: {
        type: "pie",
        backgroundColor: null,
      },
      title: {
        text: "Resumen del Día",
        style: {
          color: null,
        },
      },
      plotOptions: {
        pie: {
          innerSize: "50%",
          depth: 45,
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.percentage:.1f}% ({point.y}) ",
            style: {
              color: null,
              textOutline: "none",
            },
          },
        },
      },
      series: [
        {
          name: "Clientes",
          colorByPoint: true,
          data: [],
        },
      ],
    });

    const updateChartOptions = () => {
      const isDark = isDarkTheme.value;
      const textColor = isDark ? "#ffffff" : "#000000";
      const backgroundColor = isDark ? "#09090b" : "#ffffff";

      chartOptions.value.chart.backgroundColor = backgroundColor;
      chartOptions.value.title.style.color = textColor;
      chartOptions.value.plotOptions.pie.dataLabels.style.color = textColor;

      const clientesActualizados =
        JSON.parse(localStorage.getItem("clientes")) || [];
      const entregados = clientesActualizados.filter(
        (cliente) => cliente.estado === "entregado"
      ).length;
      const parciales = clientesActualizados.filter(
        (cliente) => cliente.estado === "parcial"
      ).length;
      const noEntregados = clientesActualizados.filter(
        (cliente) => cliente.estado === "no_entregado"
      ).length;
      const pendientes = clientesActualizados.filter(
        (cliente) => cliente.estado === "pendiente"
      ).length;

      chartOptions.value.series[0].data = [
        { name: "Entregado", y: entregados, color: "#88dc65" },
        { name: "Parcial", y: parciales, color: "#eeca06" },
        { name: "No Entregado", y: noEntregados, color: "#ff6961" },
        { name: "Pendientes", y: pendientes, color: "#cccccc" },
      ];

      Highcharts.chart("chart-container", chartOptions.value);
    };

    const goToDashboard = () => {
      if (router) {
        router.push({ name: "dashboard" });
      } else {
        console.error("Router is undefined");
      }
    };

    const sincronizarDatos = async () => {
      if (navigator.onLine) {
        const entregasPendientes =
          JSON.parse(localStorage.getItem("entregasPendientes")) || [];
        const complementoPendiente =
          JSON.parse(localStorage.getItem("complementoPendiente")) || [];
        const noEntregadoPendiente =
          JSON.parse(localStorage.getItem("noEntregadoPendiente")) || [];

        try {
          if (entregasPendientes.length > 0) {
            await axios.post(
              "https://calidad-yesentregas-api.yes.com.sv/entregas/update/",
              entregasPendientes,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authStore.token}`,
                },
              }
            );
            localStorage.removeItem("entregasPendientes");
          }

          if (complementoPendiente.length > 0) {
            await axios.post(
              "https://calidad-yesentregas-api.yes.com.sv/entregas/complementarios/update/",
              complementoPendiente,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authStore.token}`,
                },
              }
            );
            localStorage.removeItem("complementoPendiente");
          }

          if (noEntregadoPendiente.length > 0) {
            await axios.post(
              "https://calidad-yesentregas-api.yes.com.sv/entregas/update/",
              noEntregadoPendiente,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authStore.token}`,
                },
              }
            );
            localStorage.removeItem("noEntregadoPendiente");
          }

          showAlert(
            "Sincronización",
            "Los datos se han sincronizado correctamente.",
            "success"
          );
        } catch (error) {
          console.error("Error al sincronizar los datos:", error);
          showAlert(
            "Error",
            "Hubo un problema al sincronizar los datos.",
            "error"
          );
        }
      }
    };

    onMounted(() => {
      updateChartOptions();
      setInterval(updateChartOptions, 30000);
      sincronizarDatos();
      window.addEventListener("online", sincronizarDatos);
    });

    watch([getPrimary, isDarkTheme], updateChartOptions);

    return {
      goToDashboard,
    };
  },
};
</script>

<template>
  <div>
    <Button
      label="Regresar"
      icon="pi pi-arrow-left"
      class="p-button-secondary"
      @click="goToDashboard"
    />
    <div id="chart-container"></div>
  </div>
</template>

<style scoped>
#chart-container {
  width: 100%;
  height: 400px;
}
</style>