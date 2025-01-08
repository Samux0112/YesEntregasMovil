<script setup>
import { useLayout } from "@/layout/composables/layout"; // Importa la composición del layout
import Highcharts from "highcharts";
import { onMounted, ref, watch } from "vue";
const { getPrimary, isDarkTheme } = useLayout();

// Definición inicial de las opciones del gráfico
const chartOptions = ref({
  chart: {
    type: "pie",
    backgroundColor: null, // Fondo transparente por defecto
  },
  title: {
    text: "Resumen del Día",
    style: {
      color: null, // Color de texto dinámico
    },
  },
  plotOptions: {
    pie: {
      innerSize: "50%", // Convertir a doughnut
      depth: 45,
      dataLabels: {
        enabled: true,
        format: "{point.name}: {point.percentage:.1f} %", // Mostrar nombre y porcentaje
        style: {
          color: null, // Color de texto dinámico
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

// Función para actualizar las opciones del gráfico
const updateChartOptions = () => {
  const isDark = isDarkTheme.value;
  const primaryColor = getPrimary.value;
  const textColor = isDark ? "#ffffff" : "#000000";
  const backgroundColor = isDark ? "#09090b" : "#ffffff";

  chartOptions.value.chart.backgroundColor = backgroundColor;
  chartOptions.value.title.style.color = textColor;
  chartOptions.value.plotOptions.pie.dataLabels.style.color = textColor;

  const clientesActualizados =
    JSON.parse(localStorage.getItem("clientes")) || [];
  const totalClientes = clientesActualizados.length;
  const entregados = clientesActualizados.filter(
    (cliente) => cliente.estado === "entregado"
  ).length;
  const parciales = clientesActualizados.filter(
    (cliente) => cliente.estado === "parcial"
  ).length;
  const noEntregados = clientesActualizados.filter(
    (cliente) => cliente.estado === "no_entregado"
  ).length;

  chartOptions.value.series[0].data = [
    { name: "Entregado", y: entregados, color: "#88dc65" }, // Verde claro
    { name: "Parcial", y: parciales, color: "#eeca06" }, // Amarillo claro
    { name: "No Entregado", y: noEntregados, color: "#ff6961" }, // Rojo claro
  ];

  Highcharts.chart("chart-container", chartOptions.value);
};

onMounted(() => {
  updateChartOptions();
  // Actualizar el gráfico cada 30 segundos (30000 ms)
  setInterval(updateChartOptions, 30000);
});

// Observar cambios en el tema para actualizar el gráfico dinámicamente
watch([getPrimary, isDarkTheme], updateChartOptions);
</script>

<template>
  <div id="chart-container"></div>
</template>