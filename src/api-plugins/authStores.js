import router from '@/router';
import axios from 'axios';
import { defineStore } from 'pinia';
import Swal from 'sweetalert2';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        groups: [],
        error: null,
        location: null,
        token: null, // Almacena el token
    }),

    actions: {
        async login(username, password) {
            try {
                // Solicitar autenticación en la API
                const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/auth/', {
                    username,
                    password,
                    country: 'sv'
                });

                // Verificar respuesta
                if (!response.data.user?.user_data || !response.data.user?.groups || !response.data.token?.access_token) {
                    throw new Error('Credenciales incorrectas o falta de información en la respuesta.');
                }

                // Guardar usuario, grupos y token en el estado
                this.user = response.data.user.user_data;
                this.groups = response.data.user.groups;
                this.token = response.data.token.access_token;
                this.error = null;

                // Verificar si el usuario tiene los permisos necesarios
                const hasRequiredGroup = this.groups.includes('YesEntregas-Entregador');
                if (!hasRequiredGroup) {
                    throw new Error('No tienes los permisos necesarios para acceder a este sistema.');
                }

                // Guardar en localStorage
                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('groups', JSON.stringify(this.groups));
                localStorage.setItem('token', this.token);

                // Configurar el token en las solicitudes de Axios
                this.setAxiosToken(this.token);

                // Alerta de inicio de sesión exitoso
                Swal.fire({
                    title: '¡Inicio de sesión exitoso!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Solicitar permisos de geolocalización
                this.requestLocationPermissions();

                router.push({ name: 'dashboard' });
            } catch (err) {
                console.error('Error al autenticar:', err);
                this.error = err.message || 'Usuario o contraseña incorrectos.';
                Swal.fire({
                    title: 'Error',
                    text: this.error,
                    icon: 'error',
                    confirmButtonText: 'Intentar de nuevo'
                });
            }
        },

        setAxiosToken(token) {
            // Configura el token en el encabezado Authorization para todas las solicitudes
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        },

        loadSession() {
            const user = localStorage.getItem('user');
            const groups = localStorage.getItem('groups');
            const token = localStorage.getItem('token');
            const location = localStorage.getItem('location');

            if (user && groups && token) {
                try {
                    this.user = JSON.parse(user);
                    this.groups = JSON.parse(groups);
                    this.token = token;
                    if (location) {
                        this.location = JSON.parse(location);
                    }

                    // Configurar el token en Axios
                    this.setAxiosToken(this.token);

                    console.log('Sesión cargada:', this.user, this.groups, this.location);
                } catch (error) {
                    console.error('Error al cargar la sesión:', error);
                }
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
                    this.user = null;
                    this.groups = [];
                    this.location = null;
                    this.token = null;
                    localStorage.removeItem('user');
                    localStorage.removeItem('groups');
                    localStorage.removeItem('token');
                    localStorage.removeItem('location');

                    // Eliminar el encabezado Authorization
                    delete axios.defaults.headers.common['Authorization'];

                    Swal.fire({
                        title: 'Has cerrado sesión correctamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    router.push({ name: 'login' });
                }
            });
        },

        isAuthenticated() {
            return !!this.user && !!this.token;
        },

        hasGroup(groupName) {
            return this.groups.includes(groupName);
        }
    }
});
