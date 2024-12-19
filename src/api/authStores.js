import router from '@/router';
import axios from 'axios';
import { defineStore } from 'pinia';
import Swal from 'sweetalert2';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null, // Información del usuario autenticado
        groups: [], // Grupos asociados al usuario
        error: null, // Mensaje de error en caso de autenticación fallida
        location: null // Ubicación del usuario (latitud y longitud)
    }),

    actions: {
        async login(username, password) {
            try {
                // Llamada a la API para autenticar
                const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/auth/', {
                    username,
                    password,
                    country: 'sv'
                });

                // Validar la respuesta de la API
                if (!response.data.user_data || !response.data.groups) {
                    throw new Error('Credenciales incorrectas.');
                }

                // Asignar los datos del usuario y grupos
                this.user = response.data.user_data;
                this.groups = response.data.groups;
                this.error = null;

                // Validar si el usuario pertenece al grupo requerido
                const hasRequiredGroup = this.groups.includes('YesEntregas-Entregador');
                if (!hasRequiredGroup) {
                    throw new Error('No tienes los permisos necesarios para acceder a este sistema.');
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

                // Solicitar permisos de geolocalización
                this.requestLocationPermissions();

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

        async requestLocationPermissions() {
            try {
                if ('geolocation' in navigator) {
                    // Solicitar ubicación actual
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            // Guardar las coordenadas en el estado
                            this.location = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            };

                            console.log('Ubicación obtenida:', this.location);

                            // Guardar la ubicación en localStorage
                            localStorage.setItem('location', JSON.stringify(this.location));
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
                        { enableHighAccuracy: true }
                    );
                } else {
                    Swal.fire({
                        title: 'Geolocalización no soportada',
                        text: 'Tu dispositivo no soporta geolocalización.',
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                }
            } catch (error) {
                console.error('Error al solicitar permisos de ubicación:', error);
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
                    this.location = null; // Limpiar ubicación
                    localStorage.removeItem('user');
                    localStorage.removeItem('groups');
                    localStorage.removeItem('location');

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
            // Recuperar datos de usuario, grupos y ubicación desde localStorage
            const user = localStorage.getItem('user');
            const groups = localStorage.getItem('groups');
            const location = localStorage.getItem('location'); // Cargar ubicación

            if (user && groups) {
                try {
                    this.user = JSON.parse(user); // Asignar usuario al estado
                    this.groups = JSON.parse(groups); // Asignar grupos al estado
                    if (location) {
                        this.location = JSON.parse(location); // Asignar ubicación si existe
                    }
                    console.log('Sesión cargada:', this.user, this.groups, this.location);
                } catch (error) {
                    console.error('Error al cargar la sesión:', error);
                }
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
