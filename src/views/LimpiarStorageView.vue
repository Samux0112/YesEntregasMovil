<script>
import { useAuthStore } from "@/api-plugins/authStores"; // Asegúrate de importar tu authStore
import { useLayout } from "@/layout/composables/layout";
import axios from "axios";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

export default {
  setup() {
    const { showAlert } = useLayout();
    const router = useRouter();
    const authStore = useAuthStore();

    const username = ref("");
    const password = ref("");

    // Función para limpiar el localStorage y desloguear al usuario
    const limpiarLocalStorage = async () => {
      try {
        // Convertir el username y password a mayúsculas antes de autenticarlos
        await authStore.login(
          username.value.toUpperCase(),
          password.value.toUpperCase()
        );
        localStorage.clear();
        showAlert({
          title: "Limpieza Completa",
          text: "Todos los datos del localStorage han sido eliminados.",
          icon: "success",
          confirmButtonText: "Entendido",
        });

        // Desloguear al usuario sin mostrar mensaje de confirmación adicional
        authStore.user = null;
        authStore.groups = [];
        authStore.token = null;
        authStore.location = null;

        localStorage.removeItem("user");
        localStorage.removeItem("groups");
        localStorage.removeItem("token");
        localStorage.removeItem("location");

        delete axios.defaults.headers.common["Authorization"];

        router.push({ name: "login" }); // Redirigir a la pantalla de inicio
      } catch (error) {
        showAlert({
          title: "Error de Autenticación",
          text: "Usuario o contraseña incorrectos.",
          icon: "error",
          confirmButtonText: "Intentar de nuevo",
        });
      }
    };

    // Función para mostrar el diálogo de confirmación
    const confirmarLimpieza = () => {
      showAlert({
        title: "Confirmación",
        text: "¿Estás seguro de que deseas eliminar toda la base de datos de su dispositivo?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          return showAlert({
            title: "Autenticación Requerida",
            html: `
              <input id="username" type="text" placeholder="Usuario" class="swal2-input" style="text-transform:uppercase;">
              <input id="password" type="password" placeholder="Contraseña" class="swal2-input" style="text-transform:uppercase;">
            `,
            focusConfirm: false,
            preConfirm: () => {
              const usernameInput = document
                .getElementById("username")
                .value.toUpperCase();
              const passwordInput = document
                .getElementById("password")
                .value.toUpperCase();
              return { username: usernameInput, password: passwordInput };
            },
          }).then(({ value }) => {
            if (value) {
              username.value = value.username;
              password.value = value.password;
            }
          });
        },
      })
        .then((result) => {
          if (result.isConfirmed) {
            limpiarLocalStorage();
          }
        })
        .catch((error) => {
          console.error(error);
        });
    };

    onMounted(() => {
      console.log("Componente montado");
    });

    return {
      confirmarLimpieza,
    };
  },
};
</script>
<template>
  <div>
    <Button @click="confirmarLimpieza">Limpiar LocalStorage</Button>
  </div>
</template>