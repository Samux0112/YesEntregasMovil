import router from '@/router';
import axios from 'axios';
import { defineStore } from 'pinia';
import Swal from 'sweetalert2';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        groups: [],
        error: null
    }),
    actions: {
        async login(username, password) {
            try {
                const response = await axios.post('/api/auth', {
                    username,
                    password,
                    country: 'sv'
                });

                this.user = response.data.user_data;
                this.groups = response.data.groups;
                this.error = null;

                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('groups', JSON.stringify(this.groups));

                // Alerta de inicio de sesión exitoso
                Swal.fire({
                    title: '¡Inicio de sesión exitoso!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Redirigir al dashboard después del login exitoso
                router.push({ name: 'dashboard' });
            } catch (err) {
                console.error('Error al autenticar:', err);
                this.error = 'Usuario o contraseña incorrectos.';
                this.user = null;
                this.groups = [];

                // Alerta de error de autenticación
                Swal.fire({
                    title: 'Error',
                    text: this.error,
                    icon: 'error',
                    confirmButtonText: 'Intentar de nuevo'
                });
            }
        },

        logout() {
            // Confirmación antes de cerrar sesión
            Swal.fire({
                title: '¿Estás seguro de que deseas cerrar sesión?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Limpiar el estado y el almacenamiento local
                    this.user = null;
                    this.groups = [];
                    localStorage.clear();

                    // Alerta de cierre de sesión exitoso
                    Swal.fire({
                        title: 'Has cerrado sesión correctamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // Redirigir al login después de cerrar sesión
                    router.push({ name: 'login' });
                }
            });
        },

        loadSession() {
            const user = localStorage.getItem('user');
            const groups = localStorage.getItem('groups');
            if (user && groups) {
                this.user = JSON.parse(user);
                this.groups = JSON.parse(groups);
            } else {
                this.user = null;
                this.groups = [];
            }
        }
    }
});
