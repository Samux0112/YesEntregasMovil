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

    const password = ref("");
    const storedPassword = localStorage.getItem("password"); // Obtener la contraseña almacenada
    const isButtonDisabled = ref(false); // Estado para habilitar/deshabilitar el botón

    // Función para limpiar el localStorage y desloguear al usuario
    const limpiarLocalStorage = async () => {
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
      localStorage.removeItem("password"); // Eliminar la contraseña almacenada

      delete axios.defaults.headers.common["Authorization"];

      router.push({ name: "login" }); // Redirigir a la pantalla de inicio
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
        allowOutsideClick: false, // Evitar cerrar al hacer clic fuera
        preConfirm: async () => {
          const { value: authResult } = await showAlert({
            title: "Autenticación Requerida",
            html: `
              <p>Usuario: ${authStore.user.Username}</p>
              <input id="password" type="password" placeholder="Contraseña" class="swal2-input" style="text-transform:uppercase;">
            `,
            focusConfirm: false,
            allowOutsideClick: false, // Evitar cerrar al hacer clic fuera
            preConfirm: () => {
              const passwordInput = document
                .getElementById("password")
                .value.trim();

              if (!passwordInput) {
                showAlert({
                  title: "Error",
                  text: "El campo de la contraseña es obligatorio",
                  icon: "error",
                  confirmButtonText: "Entendido",
                });
                return false;
              }

              if (
                storedPassword &&
                passwordInput.toUpperCase() === storedPassword.toUpperCase()
              ) {
                return {
                  password: passwordInput.toUpperCase(),
                };
              } else {
                showAlert({
                  title: "Error de Autenticación",
                  text: "Contraseña incorrecta.",
                  icon: "error",
                  confirmButtonText: "Intentar de nuevo",
                });
                return false;
              }
            },
          });

          if (authResult) {
            password.value = authResult.password;
            return true;
          }
          return false;
        },
      })
        .then((result) => {
          if (result.isConfirmed && password.value) {
            limpiarLocalStorage();
          } else {
            isButtonDisabled.value = false; // Habilitar el botón si la contraseña es incorrecta
          }
        })
        .catch((error) => {
          console.error(error);
          isButtonDisabled.value = false; // Habilitar el botón en caso de error
        });
    };

    onMounted(() => {
      console.log("Componente montado");
    });

    return {
      confirmarLimpieza,
      isButtonDisabled,
    };
  },
};
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12 text-center">
      <Button
        :disabled="isButtonDisabled"
        label="Limpiar Base de datos"
        class="w-auto p-2 text-sm"
        @click="confirmarLimpieza"
      ></Button>
    </div>
  </div>
</template>