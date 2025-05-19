import { useLayout } from "@/layout/composables/layout";
import router from '@/router';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import axios from 'axios';
import { defineStore } from 'pinia';
const { showAlert } = useLayout();

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        groups: JSON.parse(localStorage.getItem('groups')) || [],
        token: localStorage.getItem('token') || null,
        error: null,
        location: JSON.parse(localStorage.getItem('location')) || null,
        actions: [], // Para almacenar las acciones del usuario
        isMuted: JSON.parse(localStorage.getItem('isMuted')) || false, // Estado de mute
        horaInicioVisita: null,
        horaFinVisita: null,
        horaInicioTraslado: null,
        horaFinTraslado: null
    }),

    actions: {
       async login(username, password) {
            try {
                const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/auth/', {
                    username,
                    password,
                    country: username.includes("GT") ? 'gt' : 'sv' // Determina el país según el nombre de usuario
                });

                if (!response.data.user?.user_data || !response.data.user?.groups || !response.data.token?.access_token) {
                    throw new Error('Credenciales incorrectas o falta de información en la respuesta.');
                }

                this.user = response.data.user.user_data;
                this.groups = response.data.user.groups;
                this.token = response.data.token.access_token;
                this.error = null;

                // Verifica si el usuario pertenece a alguno de los grupos permitidos
                const hasRequiredGroup = this.groups.includes('YesEntregas-Entregador') || 
                                         this.groups.includes('YesEntregas-EntregadorGT');
                if (!hasRequiredGroup) {
                    showAlert({
                        title: 'Acceso Denegado',
                        text: 'No tienes los permisos necesarios para acceder a este sistema.',
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                    return;
                }

                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('groups', JSON.stringify(this.groups));
                localStorage.setItem('token', this.token);
                localStorage.setItem('password', password); // Guardar la contraseña

                this.setAxiosToken(this.token);

                showAlert({
                    title: '¡Inicio de sesión exitoso!',
                    text: `Bienvenido, ${this.user?.Username || 'Usuario'}`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Solicitar permisos de geolocalización después del inicio de sesión
                await this.startLocationWatch();

                // Registrar acción de inicio de sesión
                await this.registrarAccion('Inicio de sesión');

                // Redirigir al dashboard
                router.push({ name: 'dashboard' });

                // Iniciar registro de ubicación cada minuto
                setInterval(async () => {
                    await this.registrarAccion('Cambio de ubicación');
                }, 60000); // 60000 ms = 1 minuto

                // Iniciar la observación del localStorage
                this.startWatchingLocalStorage();

            } catch (err) {
                console.error('Error al autenticar:', err);

                if (err.response && err.response.status === 401) {
                    this.error = 'Usuario o contraseña incorrectos.';
                } else if (err.response && err.response.status === 500) {
                    this.error = 'Usuario o contraseña incorrectos.';
                } else {
                    this.error = err.message || 'Ocurrió un error inesperado.';
                }
                showAlert({
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

        // Función para observar cambios en localStorage
        startWatchingLocalStorage() {
            let lastClientes = JSON.parse(localStorage.getItem('clientes')) || [];

            setInterval(async () => {
                const currentClientes = JSON.parse(localStorage.getItem('clientes')) || [];
                if (JSON.stringify(currentClientes) !== JSON.stringify(lastClientes)) {
                    await this.handleLocalStorageChange(lastClientes, currentClientes);
                    lastClientes = currentClientes;
                }
            }, 1000); // Verificar cambios cada segundo
        },

        // Definir la función startLocationWatch
        async startLocationWatch() {
            if ("geolocation" in navigator) {
                const successCallback = (position) => {
                    const newLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    if (
                        !this.location ||
                        this.location.latitude !== newLocation.latitude ||
                        this.location.longitude !== newLocation.longitude
                    ) {
                        this.location = newLocation;
                        localStorage.setItem("location", JSON.stringify(newLocation));
                        console.log("Ubicación actualizada:", newLocation);
                    }
                };

                const errorCallback = (error) => {
                    console.error("Error al obtener la ubicación:", error.message);
                };

                const options = {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                };

                navigator.geolocation.watchPosition(successCallback, errorCallback, options);
            } else {
                console.error("Geolocalización no soportada por el navegador");
                showAlert({
                    title: "Error",
                    text: "Geolocalización no soportada por el navegador",
                    icon: "error",
                    confirmButtonText: "Entendido",
                });
            }
        },

        // Función para manejar los cambios en localStorage
        async handleLocalStorageChange(oldClientes, newClientes) {
            for (let i = 0; i < newClientes.length; i++) {
                if (JSON.stringify(oldClientes[i]) !== JSON.stringify(newClientes[i])) {
                    const { KUNNR, estado, vbeln } = newClientes[i];
                    if (estado && vbeln) {
                        await this.registrarEntrega(KUNNR, vbeln, estado);
                    }
                }
            }
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

                    // Iniciar la observación del localStorage
                    this.startWatchingLocalStorage();
                } catch (error) {
                    console.error('Error al cargar la sesión:', error);
                }
            }
        },

        async logout() {
            showAlert({
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
                    localStorage.removeItem('password'); // Eliminar la contraseña almacenada

                    delete axios.defaults.headers.common['Authorization'];

                    showAlert({
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

        async obtenerUbicacionYEnviarLog(accion, kunnag = null, vbeln = null, detalles = {}) {
            console.log(`Iniciando obtenerUbicacionYEnviarLog: ${accion}`); // Añadir log de depuración
        
            // Utilizar la ubicación del localStorage
            const location = JSON.parse(localStorage.getItem('location'));
            if (!location) {
                console.error('No se pudo obtener la ubicación del localStorage.');
                return;
            }
        
            // Calcular tiempos de visita y traslado
            const tiempoVisita = detalles.horaInicioVisita && detalles.horaFinVisita ? 
                (detalles.horaFinVisita - detalles.horaInicioVisita) / 1000 / 60 : null; // en minutos
            const tiempoTraslado = detalles.tiempoTraslado || null; // en formato "X h Y min"
        
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
                    'latitudEntregador': location.latitude.toString(),
                    'longitudEntregador': location.longitude.toString(),
                    'latitudCliente': detalles.latitudCliente,
                    'longitudCliente': detalles.longitudCliente,
                    'kunnag': kunnag,
                    'vbeln': vbeln,
                    'nota_aclaratoria': detalles.nota_aclaratoria || "", // Incluye detalles adicionales como el comentario si está presente
                    'hora de visita': detalles.horaInicioVisita ? new Date(detalles.horaInicioVisita).toLocaleString('es-ES') : null,
                    'tiempo de visita': tiempoVisita ? `${tiempoVisita.toFixed(2)} minutos` : null,
                    'tiempo de traslado': tiempoTraslado ? tiempoTraslado : null // Asegúrate de que tiempoTraslado se maneje correctamente
                }
            };
        
            console.log('Datos del log:', logData); // Añadir log de depuración
        
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
                        this.actions.push(logData.json_accion);
                    } else {
                        console.error('Error al enviar el log:', response);
                    }
                } catch (error) {
                    console.error('Error al enviar el log:', error);
                }
            } else {
                console.error('Token no encontrado en el almacenamiento local.');
            }
        },

        async registrarAccion(accion, detalles = {}) {
            console.log(`Registrando acción: ${accion}`); // Añadir log de depuración
            await this.obtenerUbicacionYEnviarLog(accion, detalles.kunnag, detalles.vbeln, detalles);
        },

        async registrarEntrega(kunnag, vbeln, tipoEntrega, comentario = '', latitudCliente = null, longitudCliente = null) {
            if (!vbeln) {
                console.warn(`VBELN no disponible para kunnag: ${kunnag}, tipoEntrega: ${tipoEntrega}`);
                return;
            }
            const accion = `Entrega realizada (${tipoEntrega})`;
            console.log(`Registrando entrega: ${accion}, kunnag: ${kunnag}, vbeln: ${vbeln}, comentario: ${comentario}`); // Añadir log de depuración
        
            // Calcular el tiempo de visita
            this.horaFinVisita = Date.now();
            const tiempoVisita = (this.horaFinVisita - this.horaInicioVisita) / 1000 / 60; // en minutos
            comentario += ` Tiempo de visita: ${tiempoVisita.toFixed(2)} minutos.`;

            // Registrar hora de inicio de traslado
            this.horaInicioTraslado = Date.now();
        
            // Llamar directamente a obtenerUbicacionYEnviarLog
            await this.obtenerUbicacionYEnviarLog(accion, kunnag, vbeln, { nota_aclaratoria: comentario, latitudCliente, longitudCliente });
        },

        async terminarDia() {
            console.log('Registrando acción: Terminar día'); // Añadir log de depuración
            await this.registrarAccion('Terminar día');
            showAlert({
                title: 'Día terminado',
                text: 'Has terminado el día correctamente.',
                icon: 'success',
                confirmButtonText: 'Entendido'
            }).then(() => {
                router.push({ name: 'dashboard' });
            });
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
                return;
            }

            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(mensaje);
                utterance.lang = 'es-ES';
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
    },
});