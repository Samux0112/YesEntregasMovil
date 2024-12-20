import initializeDatabase from '@/api-plugins/database';
import { insertLogWithJson } from '@/api-plugins/InsertLogService'; // Asegúrate de importar la función para insertar el log
import router from '@/router';
import axios from 'axios';
import { defineStore } from 'pinia';
import Swal from 'sweetalert2';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        groups: [],
        error: null,
        location: null
    }),

    actions: {
        async login(username, password) {
            try {
                const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/auth/', {
                    username,
                    password,
                    country: 'sv'
                });

                if (!response.data.user_data || !response.data.groups) {
                    throw new Error('Credenciales incorrectas.');
                }

                this.user = response.data.user_data;
                this.groups = response.data.groups;
                this.error = null;

                const hasRequiredGroup = this.groups.includes('YesEntregas-Entregador');
                if (!hasRequiredGroup) {
                    throw new Error('No tienes los permisos necesarios para acceder a este sistema.');
                }

                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('groups', JSON.stringify(this.groups));

                Swal.fire({
                    title: '¡Inicio de sesión exitoso!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Inicializar la base de datos SQLite
                console.log('Inicializando base de datos...');
                await initializeDatabase(); // Llama a tu función de inicialización
                console.log('Base de datos inicializada.');

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

        async requestLocationPermissions() {
            try {
                if ('geolocation' in navigator) {
                    navigator.geolocation.watchPosition(
                        (position) => {
                            this.location = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            };
                            console.log('Ubicación actualizada:', this.location);

                            localStorage.setItem('location', JSON.stringify(this.location));

                            // Crear el log con la ubicación y la información del usuario
                            const logData = {
                                id: Date.now(), // ID único
                                json_accion: {
                                    'fecha-hora': new Date().toLocaleString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: true,
                                    }),
                                    'Accion': 'Login',
                                    'Username': this.user?.Username || 'No disponible',
                                    'latitud': this.location.latitude,
                                    'longitud': this.location.longitude
                                },
                                aplicado: 1 // Estado de "aplicado"
                            };

                            // Insertar el log en la base de datos
                            insertLogWithJson(logData);
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

        loadSession() {
            const user = localStorage.getItem('user');
            const groups = localStorage.getItem('groups');
            const location = localStorage.getItem('location');

            if (user && groups) {
                try {
                    this.user = JSON.parse(user);
                    this.groups = JSON.parse(groups);
                    if (location) {
                        this.location = JSON.parse(location); // Cargar ubicación
                    }
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
                    localStorage.removeItem('user');
                    localStorage.removeItem('groups');
                    localStorage.removeItem('location');

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
            return !!this.user;
        },

        hasGroup(groupName) {
            return this.groups.includes(groupName);
        }
    }
});
