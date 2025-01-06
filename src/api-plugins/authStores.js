import router from '@/router';
import axios from 'axios';
import { defineStore } from 'pinia';
import Swal from 'sweetalert2';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        groups: [],
        token: null,
        error: null,
        location: null,
        actions: [], // Para almacenar las acciones del usuario
        isMuted: JSON.parse(localStorage.getItem('isMuted')) || false // Estado de mute
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

                // Registrar acción de inicio de sesión
                await this.registrarAccion('Inicio de sesión');

                // Solicitar permisos de geolocalización después del inicio de sesión
                this.requestLocationPermissions();

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

                    const successCallback = async (position) => {
                        const newLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };

                        // Si la ubicación ha cambiado, enviar un log
                        if (!this.location || 
                            this.location.latitude !== newLocation.latitude || 
                            this.location.longitude !== newLocation.longitude) {
                            this.location = newLocation;
                            localStorage.setItem('location', JSON.stringify(this.location));
                            console.log('Ubicación actualizada:', this.location);

                            // Registrar acción de cambio de ubicación
                            await this.registrarAccion('Cambio de ubicación');
                        }
                    };

                    const errorCallback = (error) => {
                        console.error('Error al obtener la ubicación:', error.message);
                    };

                    const options = {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    };

                    // Usar watchPosition para actualizar la ubicación continuamente
                    navigator.geolocation.watchPosition(successCallback, errorCallback, options);
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

        async obtenerYGuardarUbicacion() {
            return new Promise((resolve) => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lon = position.coords.longitude;
                            localStorage.setItem('userLatitude', lat);
                            localStorage.setItem('userLongitude', lon);
                            console.log(`Ubicación obtenida y guardada: Latitud ${lat}, Longitud ${lon}`);
                            resolve({ lat, lon });
                        },
                        (error) => {
                            console.error('Error obteniendo la geolocalización:', error);
                            Swal.fire({
                                title: 'Error',
                                text: 'No se pudo obtener la ubicación. Asegúrate de que los permisos están habilitados.',
                                icon: 'error',
                                confirmButtonText: 'Entendido'
                            });
                            // Resolver con valores predeterminados si hay un error
                            resolve({ lat: 0, lon: 0 });
                        }
                    );
                } else {
                    console.error('Geolocalización no soportada por el navegador');
                    Swal.fire({
                        title: 'Error',
                        text: 'Geolocalización no soportada por el navegador',
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                    // Resolver con valores predeterminados si la geolocalización no es soportada
                    resolve({ lat: 0, lon: 0 });
                }
            });
        },

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

        async logout() {
            Swal.fire({
                title: '¿Estás seguro de que deseas cerrar sesión?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    // Registrar acción de cierre de sesión antes de limpiar el estado
                    await this.registrarAccion('Cierre de sesión');

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
        },

        async obtenerUbicacionYEnviarLog(accion) {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    this.location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    console.log('Ubicación obtenida:', this.location);

                    const logData = {
                        json_accion: {
                            'fecha-hora': new Date().toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            }),
                            'Accion': accion,
                            'Username': this.user?.Username || 'No disponible',
                            'latitud': this.location.latitude.toString(),
                            'longitud': this.location.longitude.toString(),
                        }
                    };

                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/logs/', logData, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            if (response.status === 200 || response.status === 201) {
                                console.log('Log enviado correctamente.');
                                this.actions.push(logData.json_accion); // Registrar la acción
                            } else {
                                console.error('Error al enviar el log:', response);
                            }
                        } catch (error) {
                            console.error('Error al enviar el log:', error);
                        }
                    } else {
                        console.error('Token no encontrado en el almacenamiento local.');
                    }
                }, (error) => {
                    console.error('Error al obtener la ubicación:', error.message);
                });
            }
        },

        async registrarAccion(accion) {
            await this.obtenerUbicacionYEnviarLog(accion);
        },

        toggleMute() {
            this.isMuted = !this.isMuted;
            localStorage.setItem('isMuted', JSON.stringify(this.isMuted));
            if (this.isMuted) {
                this.detenerHabla();
            }
        },

        detenerHabla() {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            } else {
                TextToSpeech.stop();
            }
        },

        async hablarMensaje(mensaje) {
            if (this.isMuted) {
                return; // Si está en mute, no hacer nada
            }

            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(mensaje);
                utterance.lang = 'es-ES'; // Configurar el idioma
                window.speechSynthesis.speak(utterance);
            } else {
                try {
                    await TextToSpeech.speak({
                        text: mensaje,
                        lang: 'es-ES',
                        rate: 1.0,
                        pitch: 1.0,
                        volume: 1.0
                    });
                } catch (error) {
                    console.warn('Error al utilizar la síntesis de voz en la plataforma nativa:', error);
                }
            }
        }
    }
});