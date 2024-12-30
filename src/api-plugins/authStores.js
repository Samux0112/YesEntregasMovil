import router from '@/router';
import axios from 'axios';
import { defineStore } from 'pinia';
import Swal from 'sweetalert2';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        groups: [],
        token: null,
        error: null,
        location: null,
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

                this.user = response.data.user.user_data;
                this.groups = response.data.user.groups;
                this.token = response.data.token.access_token;
                this.error = null;

                // Verificar si el usuario tiene los permisos necesarios
                const hasRequiredGroup = this.groups.includes('YesEntregas-Entregador');
                if (!hasRequiredGroup) {
                    // Mostrar mensaje de error
                    Swal.fire({
                        title: 'Acceso Denegado',
                        text: 'No tienes los permisos necesarios para acceder a este sistema.',
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                    return; // Prevenir acceso al sistema
                }

                // Guardar en localStorage
                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('groups', JSON.stringify(this.groups));
                localStorage.setItem('token', this.token);

                // Configurar token en Axios
                this.setAxiosToken(this.token);

                // Alerta de inicio de sesión exitoso
                Swal.fire({
                    title: '¡Inicio de sesión exitoso!',
                    text: `Bienvenido, ${this.user?.Username || 'Usuario'}`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Redirigir al dashboard
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
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        },

        async requestLocationPermissions() {
            try {
                if ('geolocation' in navigator) {
                    console.log('Solicitando permisos de geolocalización...');

                    const updateLocation = async () => {
                        navigator.geolocation.getCurrentPosition(
                            async (position) => {
                                this.location = {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                };
                                localStorage.setItem('location', JSON.stringify(this.location));
                                console.log('Ubicación actualizada:', this.location);
                            },
                            (error) => {
                                console.error('Error al obtener la ubicación:', error.message);
                                Swal.fire({
                                    title: 'Acceso a la ubicación',
                                    text: 'Se requiere acceso a la ubicación para esta aplicación.',
                                    icon: 'warning',
                                    confirmButtonText: 'Entendido'
                                });
                            },
                            {
                                enableHighAccuracy: true,
                                timeout: 5000,
                                maximumAge: 0
                            }
                        );
                    };

                    updateLocation();
                    setInterval(updateLocation, 60000); // Actualizar cada 60 segundos
                }
            } catch (error) {
                console.error('Error al solicitar permisos de ubicación:', error);
                Swal.fire({
                    title: 'Error al solicitar permisos',
                    text: 'No se pudo acceder a la ubicación. Asegúrate de habilitar los permisos.',
                    icon: 'error',
                    confirmButtonText: 'Intentar de nuevo'
                });
            }
        },
// inserta el json en la base de datos 
        insertLogWithJson(logData) {
            const logs = JSON.parse(localStorage.getItem('logs')) || [];
            logs.push(logData);
            localStorage.setItem('logs', JSON.stringify(logs));
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
                    this.token = null;
                    this.location = null;

                    localStorage.removeItem('user');
                    localStorage.removeItem('groups');
                    localStorage.removeItem('token');
                    localStorage.removeItem('location');

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