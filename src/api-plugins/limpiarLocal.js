// Constante para la clave de la fecha de almacenamiento
const STORAGE_DATE_KEY = 'storageDate';

// Función para limpiar todo el localStorage
const clearLocalStorage = () => {
    localStorage.clear();
    console.log('LocalStorage cleared.');
};

// Función para verificar si ha pasado más de un día desde la última actualización
const checkStorageDate = () => {
    const storedDate = localStorage.getItem(STORAGE_DATE_KEY);
    if (storedDate) {
        const currentDate = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato 'YYYY-MM-DD'
        const previousDate = storedDate.split('T')[0]; // Obtener la fecha almacenada en formato 'YYYY-MM-DD'
        // Si la fecha ha cambiado (ha pasado más de un día)
        if (currentDate !== previousDate) {
            clearLocalStorage();
        }
    }
    // Almacenar la fecha actual
    localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString());
};

// Llamar a la función para verificar la fecha del almacenamiento
checkStorageDate();