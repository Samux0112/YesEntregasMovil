<script setup>
import { useAuthStore } from '@/api-plugins/authStores.js'; // Importa el store de autenticación
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');

const authStore = useAuthStore(); // Instancia del store
const router = useRouter();

// Función para manejar el inicio de sesión
const handleLogin = async () => {
    await authStore.login(username.value, password.value); // Llamamos la acción login
};
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="flex justify-center mb-8">
                            <img src="@/assets/lactolac-logo.png" alt="Logo" class="w-42 h-40 object-contain" />
                        </div>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Bienvenido al sistema de entregas!</div>
                        <span class="text-muted-color font-medium">Ingresa tus credenciales para continuar</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nombre de usuario</label>
                        <InputText id="username" type="text" placeholder="Nombre de usuario" class="w-full mb-8" v-model="username" @input="username = username.toUpperCase()" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                        <Password id="password" v-model="password" placeholder="Contraseña" :toggleMask="true" class="mb-4" fluid :feedback="false" />
                        <!-- Botón de inicio de sesión -->
                        <Button label="Iniciar Sesión" class="w-full" @click="handleLogin"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
