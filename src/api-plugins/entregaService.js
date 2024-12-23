// api-plugins/entregaService.js
import { SQLite } from '@capacitor-community/sqlite';

export const getLogs = async () => {
  try {
    const db = await SQLite.create({
      name: 'yesentregas',
      location: 'default',
    });

    await db.open();

    // Consulta los logs en la tabla 'log'
    const query = 'SELECT * FROM log'; 
    const result = await db.executeSql(query);

    // Si los logs están vacíos, retornar un arreglo vacío
    if (result.rows.length === 0) {
      return [];
    }

    const logs = [];
    for (let i = 0; i < result.rows.length; i++) {
      logs.push(result.rows.item(i));
    }

    db.close();
    return logs;
  } catch (error) {
    console.error('Error al obtener los logs: ', error);
    return []; // En caso de error, retornar un arreglo vacío
    
  }
};
