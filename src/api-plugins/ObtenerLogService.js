import Swal from 'sweetalert2';

export const getLogsFromLocalStorage = () => {
  try {
    // Obtener los logs del localStorage
    const logs = JSON.parse(localStorage.getItem('logs')) || [];

    if (logs.length === 0) {
      console.log('No se encontraron registros en localStorage.');
      return [];
    }

    console.log('Logs obtenidos:', logs);
    return logs; // Retorna los logs como un array de objetos
  } catch (error) {
    console.error('Error al obtener los logs:', error.message);

    // Alerta en caso de error
    Swal.fire({
      title: 'Error',
      text: `No se pudo obtener los registros. Detalles: ${error.message}`,
      icon: 'error',
      confirmButtonText: 'Intentar de nuevo',
    });

    throw error; // Relanzar el error si es necesario manejarlo en otro lugar
  }
};
