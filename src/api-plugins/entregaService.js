// api-plugins/entregaService.js
import { CapacitorSQLite } from '@capacitor-community/sqlite'; // Usa este nombre correcto

export const getLogs = async () => {
  try {
    const db = await CapacitorSQLite.create({
      name: 'yesentregas',
      location: 'default',
    });
    await db.open();

    const query = 'SELECT * FROM logs';
    const result = await db.executeSql(query);

    let logs = [];
    for (let i = 0; i < result.rows.length; i++) {
      logs.push(result.rows.item(i));
    }
    db.close(); // Asegúrate de cerrar la base de datos después de la consulta
    return logs;
  } catch (error) {
    console.error('Error al cargar los logs:', error);
    throw error;
  }
};
