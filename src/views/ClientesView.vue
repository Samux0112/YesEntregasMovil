<script setup>
import { useAuthStore } from '@/api-plugins/authStores';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import axios from 'axios';
import Swal from 'sweetalert2';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// import Highcharts from 'highcharts';

const router = useRouter();
const options = ref(['list', 'grid']);
const layout = ref('grid'); // Inicializa en 'grid'
const searchTerm = ref('');
const clientesFiltrados = ref([]);
const authStore = useAuthStore();
const username = computed(() => authStore.user?.Username || 'Invitado');
const clientes = ref([]);
const estadoFiltro = ref('Pendiente'); // Estado del filtro, inicializado en 'Pendiente'
const clientesPendientes = ref(0); // Contador de clientes pendientes
const showSubmenu = ref(false);
const submenuCliente = ref(null);
const submenuOptions = [
    { label: 'Tomar Georreferencia', value: 'georreferencia' },
    { label: 'Graficar Ruta', value: 'ruta' },
    { label: 'Formulario de Encuestas', value: 'encuesta' },
    { label: 'Llamada Telefónica', value: 'llamada' }
];

const imageUrl = ref(null);
const userLocation = ref({ latitude: 0, longitude: 0 });

const updateUserLocation = () => {
    const location = localStorage.getItem('location');
    if (location) {
        userLocation.value = JSON.parse(location);
    }
};

const startLocationWatch = () => {
    if ('geolocation' in navigator) {
        const successCallback = (position) => {
            const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            if (
                userLocation.value.latitude !== newLocation.latitude ||
                userLocation.value.longitude !== newLocation.longitude
            ) {
                userLocation.value = newLocation;
                localStorage.setItem('location', JSON.stringify(newLocation));
                console.log('Ubicación actualizada:', newLocation);
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

        navigator.geolocation.watchPosition(successCallback, errorCallback, options);
    } else {
        console.error('Geolocalización no soportada por el navegador');
        Swal.fire({
            title: 'Error',
            text: 'Geolocalización no soportada por el navegador',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
};

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180; // φ, λ en radianes
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distancia = R * c; // En metros
    return distancia / 1000; // Convertir a kilómetros
};

const recalcularDistanciaClientes = () => {
    const userLat = userLocation.value.latitude;
    const userLon = userLocation.value.longitude;

    clientes.value = clientes.value.map(cliente => {
        const distancia = calcularDistancia(userLat, userLon, parseFloat(cliente.LATITUD), parseFloat(cliente.LONGITUD));
        return {
            ...cliente,
            distancia: distancia.toFixed(2) // Actualizar la distancia
        };
    });

    clientesFiltrados.value = clientes.value.filter(cliente => {
        const nombreCoincide = cliente.NAME1.toLowerCase().includes(searchTerm.value.toLowerCase()) || cliente.NAME2.toLowerCase().includes(searchTerm.value.toLowerCase());
        const estadoCoincide = estadoFiltro.value === 'Todos' ? true : estadoFiltro.value === 'Atendido' ? ['entregado', 'parcial'].includes(cliente.estado.toLowerCase()) : cliente.estado.toLowerCase() === estadoFiltro.value.toLowerCase();
        return nombreCoincide && estadoCoincide;
    });
};

const cargarClientes = async () => {
    try {
        localStorage.removeItem('dayFinished'); // Limpiar el estado al cargar nuevos clientes
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/clientes/', {
            sortl: username.value,
        });

        if (response.data && response.data.length > 0) {
            updateUserLocation(); // Asegúrate de que la ubicación del usuario esté actualizada
            const userLat = userLocation.value.latitude;
            const userLon = userLocation.value.longitude;

            const clientesConEstado = response.data.map(cliente => {
                const distancia = calcularDistancia(userLat, userLon, parseFloat(cliente.LATITUD), parseFloat(cliente.LONGITUD));
                return {
                    ...cliente,
                    estado: cliente.estado || 'pendiente', // Asignar estado inicial como pendiente si no existe
                    distancia: distancia.toFixed(2) // Calcular y agregar la distancia
                };
            });

            const clientesGuardados = JSON.parse(localStorage.getItem('clientes')) || [];
            const clientesActualizados = clientesConEstado.map(cliente => {
                const clienteGuardado = clientesGuardados.find(c => c.KUNNR === cliente.KUNNR);
                return clienteGuardado ? { ...cliente, estado: clienteGuardado.estado } : cliente;
            });

            localStorage.setItem('clientes', JSON.stringify(clientesActualizados));
            localStorage.setItem('ultimaCargaClientes', new Date().toISOString()); // Guardar la fecha de la última carga

            clientes.value = clientesActualizados;
            clientesPendientes.value = clientesActualizados.filter(cliente => cliente.estado === 'pendiente').length;
            clientesFiltrados.value = clientesActualizados.filter(cliente => {
                const estadoCoincide = estadoFiltro.value === 'Todos' ? true : estadoFiltro.value === 'Atendido' ? ['entregado', 'parcial'].includes(cliente.estado.toLowerCase()) : cliente.estado.toLowerCase() === estadoFiltro.value.toLowerCase();
                return estadoCoincide;
            });

            Swal.fire({
                title: 'Clientes cargados',
                text: 'Los clientes han sido cargados y guardados correctamente.',
                icon: 'success',
                confirmButtonText: 'Entendido',
            });
        } else {
            Swal.fire({
                title: 'Sin clientes',
                text: 'No se encontraron clientes para el usuario proporcionado.',
                icon: 'info',
                confirmButtonText: 'Entendido',
            });
        }
    } catch (error) {
        console.error('Error al cargar los clientes:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al cargar los clientes.',
            icon: 'error',
            confirmButtonText: 'Entendido',
        });
    }
};

const mostrarClientesGuardados = () => {
    const clientesGuardados = localStorage.getItem('clientes');
    if (clientesGuardados) {
        clientes.value = JSON.parse(clientesGuardados);
        clientesPendientes.value = clientes.value.filter(cliente => cliente.estado === 'pendiente').length;
        clientesFiltrados.value = clientes.value.filter(cliente => {
            const estadoCoincide = estadoFiltro.value === 'Todos' ? true : estadoFiltro.value === 'Atendido' ? ['entregado', 'parcial'].includes(cliente.estado.toLowerCase()) : cliente.estado.toLowerCase() === estadoFiltro.value.toLowerCase();
            return estadoCoincide;
        });
    }
};

const verificarYcargarClientes = async () => {
    const ultimaCargaClientes = localStorage.getItem('ultimaCargaClientes');
    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

    if (!ultimaCargaClientes || new Date(ultimaCargaClientes).toISOString().split('T')[0] !== hoy) {
        await cargarClientes(); // Cargar clientes si no se han cargado hoy
    } else {
        mostrarClientesGuardados(); // Mostrar clientes guardados si ya se han cargado hoy
    }
};

watch([searchTerm, estadoFiltro], () => {
    clientesFiltrados.value = clientes.value.filter((cliente) => {
        const nombreCoincide = cliente.NAME1.toLowerCase().includes(searchTerm.value.toLowerCase()) || cliente.NAME2.toLowerCase().includes(searchTerm.value.toLowerCase());
        const estadoCoincide = estadoFiltro.value === 'Todos' ? true : estadoFiltro.value === 'Atendido' ? ['entregado', 'parcial'].includes(cliente.estado.toLowerCase()) : cliente.estado.toLowerCase() === estadoFiltro.value.toLowerCase();
        return nombreCoincide && estadoCoincide;
    });
});

watch(userLocation, () => {
    recalcularDistanciaClientes();
});

const irAEntregas = (cliente) => {
    if (!cliente.LATITUD || !cliente.LONGITUD) {
        Swal.fire({
            title: 'Ubicación no disponible',
            text: 'El cliente no tiene una ubicación registrada. Puedes tomar la georreferencia desde el botón más y actualizar la información del cliente.',
            icon: 'info',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    if (["entregado", "parcial", "no_entregado"].includes(cliente.estado.toLowerCase())) {
        Swal.fire({
            title: 'Acción no permitida',
            text: 'Este cliente ya ha sido atendido y no se puede modificar su estado.',
            icon: 'info',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    updateUserLocation();
    const userLat = userLocation.value.latitude;
    const userLon = userLocation.value.longitude;

    const clienteLat = parseFloat(cliente.LATITUD);
    const clienteLon = parseFloat(cliente.LONGITUD);

    console.log(`Calculando distancia entre usuario y cliente: (${userLat}, ${userLon}) y (${clienteLat}, ${clienteLon})`);

    const distancia = calcularDistancia(clienteLat, clienteLon, userLat, userLon);

    if (distancia > 100) {
        Swal.fire({
            title: 'Advertencia',
            text: 'Estás a más de 100 metros del cliente.',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        }).then(() => {
            localStorage.setItem('clienteSeleccionado', JSON.stringify(cliente));
            const clienteKunnr = String(cliente.KUNNR);
            router.push({ name: 'entregas', params: { id: clienteKunnr } });
        });
    } else {
        localStorage.setItem('clienteSeleccionado', JSON.stringify(cliente));
        const clienteKunnr = String(cliente.KUNNR);
        router.push({ name: 'entregas', params: { id: clienteKunnr } });
    }
};

const mostrarSubmenu = async (cliente) => {
    if (cliente) {
        submenuCliente.value = cliente;
        showSubmenu.value = true;
        await authStore.requestLocationPermissions();
    } else {
        console.error('Cliente es null');
    }
};

const tomarFoto = async (kunnr) => {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera
        });

        const response = await fetch(image.webPath);
        const blob = await response.blob();

        const file = new File([blob], `${kunnr}.jpg`, { type: "image/jpeg" });
        imageUrl.value = URL.createObjectURL(file);
        console.log('Foto tomada:', imageUrl.value);

        return file;
    } catch (error) {
        console.error('Error al tomar la foto:', error);
        return null;
    }
};

const enviarGeorreferencia = async (kunnr, latitud, longitud, file) => {
    const formData = new FormData();
    formData.append('kunnr', kunnr);
    formData.append('latitud', latitud);
    formData.append('longitud', longitud);
    formData.append('comentario', ''); // Agregar comentario como null
    if (file) {
        formData.append('file', file);
    }

    try {
        const response = await axios.post('https://calidad-yesentregas-api.yes.com.sv/clientes/update/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        Swal.fire('Guardado', 'La georreferencia ha sido guardada correctamente.', 'success');
        console.log('Respuesta de la API:', response.data);

        await cargarClientes(); // Esto actualizará el localStorage con la nueva información
    } catch (error) {
        console.error('Error al enviar la georreferencia:', error);
        Swal.fire('Error', 'Hubo un problema al guardar la georreferencia.', 'error');
    }
};

const handleSubmenuClick = async (option) => {
    switch (option.value) {
        case 'georreferencia':
            const fotoFile = await tomarFoto(submenuCliente.value.KUNNR);
            if (fotoFile) {
                const userLat = userLocation.value.latitude;
                const userLon = userLocation.value.longitude;
                Swal.fire({
                    title: 'Tomar Georreferencia',
                    html: `
                        <p>Latitud: ${userLat}</p>
                        <p>Longitud: ${userLon}</p>
                        <img src="${imageUrl.value}" alt="Foto tomada" style="width: 100%; height: auto;" />
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Guardar',
                    cancelButtonText: 'Cancelar',
                    preConfirm: () => {
                        if (isNaN(userLat) || isNaN(userLon) || !fotoFile) {
                            Swal.showValidationMessage(`Por favor completa todos los campos`);
                        }
                        return { latitud: userLat, longitud: userLon, file: fotoFile };
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        enviarGeorreferencia(submenuCliente.value.KUNNR, result.value.latitud, result.value.longtud, result.value.file);
                    }
                });
            }
            break;
        case 'ruta':
            const urlWaze = `https://www.waze.com/ul?ll=${userLocation.value.latitude},${userLocation.value.longitude}&navigate=yes`;
            const urlMaps = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.value.latitude},${userLocation.value.longitude}&destination=${submenuCliente.value.LATITUD},${submenuCliente.value.LONGITUD}`;
            Swal.fire({
                title: 'Graficar Ruta',
                html: `
                    <button onclick="window.open('${urlWaze}', '_blank')" class="swal2-confirm swal2-styled">Abrir en Waze
                    </button><br>
                    <button onclick="window.open('${urlMaps}', '_blank')" class="swal2-confirm swal2-styled">Abrir en Google Maps
                    </button>
                `,
                showCancelButton: true,
                cancelButtonText: 'Cerrar'
            });
            break;
        case 'encuesta':
            const urlEncuesta = `https://www.example.com/encuesta?kunnr=${submenuCliente.value.KUNNR}`;
            window.open(urlEncuesta, '_blank');
            break;
        case 'llamada':
            const numeroTelefono = submenuCliente.value.TELF1;
            window.open(`tel:${numeroTelefono}`);
            break;
    }
    showSubmenu.value = false;
};

const anunciarPantallaClientes = async () => {
    const mensaje = "Esta es la pantalla de clientes. Son los clientes pendientes que se tienen para este día.";
    
    if (authStore.isMuted) {
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
};

const chartOptions = ref({
    chart: {
        type: 'pie',
        events: {
            load: function () {
                const chart = this;
                const series = chart.series[0];
                series.data.forEach((point, i) => {
                    if (point.graphic) { // Asegurarse de que point.graphic está definido
                        point.graphic.attr({
                            opacity: 0
                        });
                        setTimeout(() => {
                            point.graphic.animate({
                                opacity: 1,
                                translateY: -20
                            }, {
                                duration: 1500,
                                easing: 'easeOutBounce'
                            });
                        }, i * 150);
                    }
                });
            }
        }
    },
    title: {
        text: 'Distribución de Entregas'
    },
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %'
            }
        }
    },
    exporting: {
        enabled: true, // Habilitar opciones de exportación
        buttons: {
            contextButton: {
                menuItems: [
                    {
                        text: 'Download PNG',
                        onclick: () => exportChartAsImage('png')
                    },
                    {
                        text: 'Download PDF',
                        onclick: () => exportChartAsPDF()
                    }
                ]
            }
        }
    },
    series: [{
        name: 'Clientes',
        colorByPoint: true,
        animation: {
            duration: 2000
        },
        data: []
    }]
});

const exportChartAsImage = async (format) => {
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
        const canvas = await html2canvas(chartContainer);
        const link = document.createElement('a');
        link.href = canvas.toDataURL(`image/${format}`);
        link.download = `chart.${format}`;
        link.click();
    } else {
        console.error('Chart container not found');
    }
};

const exportChartAsPDF = async () => {
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
        const canvas = await html2canvas(chartContainer);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape');
        pdf.addImage(imgData, 'PNG', 10, 10);
        pdf.save('chart.pdf');
    } else {
        console.error('Chart container not found');
    }
};

// En tu script setup
const terminarDia = () => {
    localStorage.setItem('dayFinished', 'true');
    Swal.fire('Día terminado', 'No puedes acceder a la vista de clientes.', 'success');
    router.push({ name: 'dashboard' });
};

// Llama a `terminarDia` en el momento adecuado, por ejemplo, después de verificar actualizaciones completas
const verificarActualizacionesCompletas = async () => {
    const clientesActualizados = JSON.parse(localStorage.getItem('clientes')) || [];
    const entregasPendientes = clientesActualizados.filter(cliente => cliente.estado === 'pendiente');
    
    if (entregasPendientes.length > 0) {
        Swal.fire({
            title: 'Advertencia',
            text: 'Aún hay clientes pendientes de entregar.',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
    } else {
        const entregados = clientesActualizados.filter(cliente => cliente.estado === 'entregado').length;
        const parciales = clientesActualizados.filter(cliente => cliente.estado === 'parcial').length;
        const noEntregados = clientesActualizados.filter(cliente => cliente.estado === 'no_entregado').length;

        chartOptions.value.series[0].data = [
            { name: 'Entregado', y: entregados },
            { name: 'Parcial', y: parciales },
            { name: 'No Entregado', y: noEntregados }
        ];

        Swal.fire({
            title: 'Jornada de entregas finalizada correctamente!',
            html: '<div id="chart-container"></div>',
            icon: 'success',
            confirmButtonText: 'Entendido',
            didOpen: () => {
                Highcharts.chart('chart-container', chartOptions.value);
            }
        }).then(() => {
            // Marcar el día como terminado y redirigir al dashboard
            terminarDia();
        });
    }
};

// Método para obtener el color de fondo según el estado del cliente
const getEstadoColor = (estado) => {
    switch (estado.toLowerCase()) {
        case 'entregado':
            return '#2f4538'; // Verde claro
        case 'parcial':
            return '#eeca06'; // Amarillo claro
        case 'no_entregado':
            return '#8b0000'; // Rojo claro
        case 'pendiente':
        default:
            return '#000'; // Gris claro
    }
};

onMounted(async () => {
    await verificarYcargarClientes();
    updateUserLocation();
    startLocationWatch();

    anunciarPantallaClientes();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12">
            <div class="mt-4">
                <!-- Campo de búsqueda -->
                <input v-model="searchTerm" type="text" placeholder="Buscar cliente por nombre..."
                    class="w-full p-2 border rounded mb-4" />
            </div>

            <!-- Filtro por estado -->
            <div class="mt-4">
                <Dropdown v-model="estadoFiltro" :options="['Pendiente', 'Atendido', 'Todos']"
                    placeholder="Filtrar por estado" class="w-full p-2 border rounded mb-4" />
            </div>
            <!-- Mostrar clientes en DataView -->
            <div v-if="clientesFiltrados.length > 0" class="mt-4">
                <DataView :value="clientesFiltrados" :layout="layout">
                    <template #header>
                        <div class="font-semibold text-xl">Lista de clientes</div>
                        <div class="flex justify-end">
                            <SelectButton v-model="layout" :options="options" :allowEmpty="false">
                                <template #option="{ option }">
                                    <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']" />
                                </template>
                            </SelectButton>
                        </div>
                    </template>
                    <!-- Diseño en formato grid -->
                    <template #grid="slotProps">
                        <div class="grid grid-cols-12 gap-4">
                            <div v-for="(cliente) in slotProps.items" :key="cliente.KUNNR"
                                class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                                <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col"
                                    :style="{ backgroundColor: getEstadoColor(cliente.estado) }">
                                    <div class="flex flex-row justify-between items-start gap-2">
                                        <div>
                                            <span class="text-lg font-semibold">{{ cliente.NAME1 }}</span>
                                            <div class="text-lg font-medium mt-1">{{ cliente.NAME2 }}</div>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">
                                                Dirección: {{ cliente.STRAS }}</span>
                                            <br>
                                            <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">
                                                Distancia entre el cliente y tú: {{ cliente.distancia }} km</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-6 mt-6">
                                        <div class="flex gap-2">
                                            <Button icon="pi pi-th-large" label="Más"
                                                class="flex-auto whitespace-nowrap"
                                                @click="() => mostrarSubmenu(cliente)" />
                                            <Button icon="pi pi-briefcase" label="Visitar"
                                                class="flex-auto md:flex-initial whitespace-nowrap"
                                                :disabled="['entregado', 'parcial', 'no_entregado'].includes(cliente.estado.toLowerCase())"
                                                @click="irAEntregas(cliente)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <!-- Diseño en formato lista -->
                    <template #list="slotProps">
                        <div class="flex flex-col">
                            <div v-for="(cliente) in slotProps.items" :key="cliente.KUNNR">
                                <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                                    :style="{ backgroundColor: getEstadoColor(cliente.estado) }">
                                    <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                        <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                            <div>
                                                <div class="text-lg font-medium mt-2">{{ cliente.NAME1 }}</div>
                                                <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">
                                                    {{ cliente.NAME2 }}</span>
                                                <br>
                                                <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">
                                                    Distancia entre el cliente y tú: {{ cliente.distancia }} km</span>
                                            </div>
                                            <div class="bg-surface-100 p-1" style="border-radius: 30px">
                                                <div class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2"
                                                    style="border-radius: 30px;">
                                                    <span class="text-surface-900 font-medium text-sm">Dirección: {{
                                                        cliente.STRAS }}</span>
                                                    <i class="pi pi-map text-500"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-col md:items-end gap-8">
                                            <div class="flex flex-row-reverse md:flex-row gap-2">
                                                <Button icon="pi pi-th-large" label="Más"
                                                    class="flex-auto md:flex-initial whitespace-nowrap"
                                                    @click="() => mostrarSubmenu(cliente)" />
                                                <Button icon="pi pi-briefcase" label="Visitar"
                                                    class="flex-auto md:flex-initial whitespace-nowrap"
                                                    :disabled="['entregado', 'parcial', 'no_entregado'].includes(cliente.estado.toLowerCase())"
                                                    @click="irAEntregas(cliente)" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </DataView>
            </div>

            <!-- Mensaje si no hay clientes cargados -->
            <div v-else class="text-xl mt-4">No hay clientes cargados.</div>
        </div>

        <!-- Submenú Modal -->
        <Dialog header="Opciones" v-model:visible="showSubmenu" :modal="true" :closable="true">
            <div class="flex flex-col gap-4">
                <Button icon="pi pi-compass" label="Tomar Georreferencia"
                    @click="handleSubmenuClick({ value: 'georreferencia' })" />
                <Button icon="pi pi-map" label="Graficar Ruta" @click="handleSubmenuClick({ value: 'ruta' })" />
                <Button icon="pi pi-question-circle" label="Formulario de Encuestas"
                    @click="handleSubmenuClick({ value: 'encuesta' })" />
                <Button icon="pi pi-phone" label="Llamada Telefónica"
                    @click="handleSubmenuClick({ value: 'llamada' })" />
            </div>
        </Dialog>
        
        <!-- Botón de Terminar Día -->
        <div v-if="clientesPendientes === 0" class="col-span-12 mt-4">
            <Button label="Terminar Día" icon="pi pi-check" class="w-full p-2 text-xl"
                @click="verificarActualizacionesCompletas" />
        </div>
    </div>
</template>