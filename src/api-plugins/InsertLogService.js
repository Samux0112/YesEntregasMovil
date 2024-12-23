import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export const insertLogWithJson = async (logData) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const sqlite = CapacitorSQLite;

      // Verificar si la conexión ya existe antes de crear una nueva
      const existingConnection = await sqlite.isConnection({ database: 'yesentregas' });
      if (!existingConnection.result) {
        console.log('Creando nueva conexión...');
        await sqlite.createConnection({
          database: 'yesentregas',
          encrypted: false,
          mode: 'no-encryption',
          version: 1,
        });
      }

      const db = await sqlite.open({ database: 'yesentregas' });

      // Insertar datos en la tabla log
      const query = `
        INSERT INTO log (id, json_accion, aplicado)
        VALUES (?, ?, ?);
      `;
      const values = [
        logData.id,
        JSON.stringify(logData.json_accion),
        logData.aplicado,
      ];

      const result = await db.run({ statement: query, values });
      console.log('Log insertado:', result);

      // Cerrar la conexión después de insertar
      await sqlite.closeConnection({ database: 'yesentregas' });
    } else {
      console.log('No está corriendo en un dispositivo nativo, no se puede insertar log');
    }
  } catch (error) {
    console.error('Error al insertar log:', error.message);
  }
};
