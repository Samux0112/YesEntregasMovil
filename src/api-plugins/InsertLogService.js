import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export const insertLogWithJson = async (logData) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const sqlite = CapacitorSQLite;

      // Cerrar cualquier conexión previa
      try {
        await sqlite.closeConnection({ database: 'yesentregas' });
      } catch (closeError) {
        console.log('No había conexión previa para cerrar:', closeError.message);
      }

      // Crear una nueva conexión
      const db = await sqlite.createConnection({
        database: 'yesentregas',
        encrypted: false,
        mode: 'no-encryption',
        version: 1,
      });

      // Abrir la base de datos
      await db.open();

      // Insertar datos en la tabla log
      const query = `
        INSERT INTO log (json_accion, aplicado)
        VALUES (?, ?);
      `;
      const values = [
        JSON.stringify(logData.json_accion),
        logData.aplicado,
      ];

      const result = await db.run({ statement: query, values });
      console.log('Log insertado:', result);

      // Cerrar la conexión
      await sqlite.closeConnection({ database: 'yesentregas' });
    } else {
      console.log('No está corriendo en un dispositivo nativo, no se puede insertar log');
    }
  } catch (error) {
    console.error('Error al insertar log:', error.message);
  }
};
