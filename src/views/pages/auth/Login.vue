<script setup>
import { useAuthStore } from '@/api-plugins/authStores.js'; // Importa el store de autenticación
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';

const username = ref('');
const password = ref('');

const authStore = useAuthStore(); // Instancia del store
const router = useRouter();

// Poner en mayúscula las palabras del username
watch(username, (newValue) => {
    username.value = newValue.toUpperCase();
});

// Poner en mayúscula las palabras de password
watch(password, (newValue) => {
    password.value = newValue.toUpperCase();
});

// Función para manejar el inicio de sesión
const handleLogin = async () => {
    try {
        await authStore.login(username.value, password.value); // Llamamos la acción login
        router.push('/dashboard'); // Redirige al dashboard si el login es exitoso
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        // Puedes mostrar una alerta al usuario aquí si el login falla
    }
};
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <!-- Reemplazamos var(--primary-color) por el código hexadecimal del color naranja -->
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, #f97316 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="flex justify-center mb-8">
                            <img src="@/assets/lactolac-logo.png" alt="Logo" class="w-42 h-40 object-contain" />
                        </div>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenido al sistema de entregas!</div>
                        <span class="text-muted-color font-medium">Ingresa tus credenciales para continuar</span>
                    </div>

                    <div>
                        <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nombre de usuario</label>
                        <InputText
                            id="username"
                            type="text"
                            class="w-full mb-8"
                            v-model="username"
                        />

                        <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                        <Password
                            id="password"
                            v-model="password"
                            :toggleMask="true"
                            class="mb-4"
                            fluid
                            :feedback="false"
                            @keyup.enter="handleLogin"
                        />
                        <!-- Botón de inicio de sesión -->
                        <Button label="Iniciar Sesión" class="w-full p-button-orange" @click="handleLogin"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Asegurar que los textos aparecen visualmente en mayusculas */
#username,
#password {
    text-transform: uppercase;
}

.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}

/* Estilos adicionales para el botón naranja */
.p-button-orange {
    background-color: #f97316; /* Color de fondo naranja */
    border-color: #f97316; /* Color del borde naranja */
}
.p-button-orange:hover {
    background-color: #c2410c; /* Color de fondo naranja más oscuro al pasar el cursor */
    border-color: #c2410c; /* Color del borde naranja más oscuro al pasar el cursor */
}
</style>