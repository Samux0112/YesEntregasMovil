<script setup>
import { ref } from "vue";
import AppMenuItem from "./AppMenuItem.vue";

const model = ref([
  {
    label: "Pantalla de bienvenida",
    items: [
      {
        label: "Inicio",
        icon: "pi pi-fw pi-home",
        to: { name: "dashboard" },
      },
    ],
  },
  {
    label: "Clientes  y entregas",
    items: [
      {
        label: "Clientes",
        icon: "pi pi-fw pi-users",
        to: { name: "clientes" },
      },
      {
        label: "Resumen de entregas",
        icon: "pi pi-fw pi-chart-bar",
        to: { name: "resumen" },
      },
    ],
  },
  {
    label: "Limpieza del dispositivo",
    items: [
      {
        label: "Limpiar base de datos",
        icon: "pi pi-trash",
        to: { name: "limpiarstorage" },
      },
    ],
  },
]);
</script>

<template>
  <ul class="layout-menu">
    <template v-for="(item, i) in model" :key="item.label">
      <app-menu-item
        v-if="!item.separator"
        :item="item"
        :index="i"
      ></app-menu-item>
      <li v-if="item.separator" class="menu-separator"></li>
    </template>
  </ul>
</template>

<style lang="scss" scoped></style>