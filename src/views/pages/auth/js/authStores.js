import router from '@/router';
import axios from 'axios';
import { defineStore } from 'pinia';
import Swal from 'sweetalert2';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null, // Información del usuario autenticado
        groups: [], // Grupos asociados al usuario
        error: null // Mensaje de error en caso de autenticación fallida
    }),

    actions: {
        async login(username, password) {
            try {
                // Llamada a la API para autenticar
                const response = await axios.post('https://ad-auth.yes.com.sv/auth/', {
                    username,
                    password,
                    country: 'sv'
                });

                // Validar la respuesta de la API
                if (!response.data.user_data || !response.data.groups) {
                    throw new Error('Respuesta inválida del servidor.');
                }

                // Asignar los datos del usuario y grupos
                this.user = response.data.user_data;
                this.groups = response.data.groups;
                this.error = null;

                // Validar si el usuario pertenece al grupo requerido
                const hasRequiredGroup = this.groups.includes('YesEntregas-Entregador');
                if (!hasRequiredGroup) {
                    throw new Error('No tienes permisos para acceder a este sistema.');
                }

                // Guardar datos en localStorage
                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('groups', JSON.stringify(this.groups));

                // Alerta de inicio de sesión exitoso
                Swal.fire({
                    title: '¡Inicio de sesión exitoso!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Redirigir al dashboard
                router.push({ name: 'dashboard' });
            } catch (err) {
                console.error('Error al autenticar:', err);

                // Asignar el error al estado y mostrar alerta
                this.error = err.message || 'Usuario o contraseña incorrectos.';
                Swal.fire({
                    title: 'Error',
                    text: this.error,
                    icon: 'error',
                    confirmButtonText: 'Intentar de nuevo'
                });
            }
        },

        logout() {
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
                    localStorage.removeItem('user');
                    localStorage.removeItem('groups');

                    // Alerta de cierre de sesión exitoso
                    Swal.fire({
                        title: 'Has cerrado sesión correctamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // Redirigir al login
                    router.push({ name: 'login' });
                }
            });
        },

        loadSession() {
            // Recuperar datos de usuario y grupos desde localStorage
            const user = localStorage.getItem('user');
            const groups = localStorage.getItem('groups');

            if (user && groups) {
                try {
                    this.user = JSON.parse(user); // Asignar usuario al estado
                    this.groups = JSON.parse(groups); // Asignar grupos al estado
                    console.log('Sesión cargada desde localStorage:', this.user, this.groups);
                } catch (error) {
                    console.error('Error al cargar la sesión:', error);
                }
            } else {
                console.log('No hay datos de sesión almacenados en localStorage.');
            }
        },

        isAuthenticated() {
            // Devuelve true si el usuario está autenticado
            return !!this.user;
        },

        hasGroup(groupName) {
            // Verifica si el usuario pertenece a un grupo específico
            return this.groups.includes(groupName);
        }
    }
});
