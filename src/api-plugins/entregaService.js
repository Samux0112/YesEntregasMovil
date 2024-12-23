import { CapacitorSQLite } from '@capacitor-community/sqlite'; // Usa este nombre correcto

export const getLogs = async () => {
  try {
    const db = await CapacitorSQLite.create({
      name: 'yesentregas',
      location: 'default',
    });
    await db.open();

    const query = 'SELECT * FROM log';  // Consulta simple para obtener todos los logs
    const result = await db.executeSql(query);

    // No hace falta convertirlo a array, directamente lo retornamos
    const logs = result.rows;  // Solo retornamos las filas tal como están
    db.close(); // Asegúrate de cerrar la base de datos después de la consulta
    return logs;
  } catch (error) {
    console.error('Error al cargar los logs:', error);
    throw error;
  }
};
