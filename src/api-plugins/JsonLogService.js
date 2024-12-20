import { CapacitorSQLite } from '@capacitor-community/sqlite';

export const insertLogWithJson = async (logData) => {
  try {
    const sqlite = CapacitorSQLite;

    // Conectarse a la base de datos
    const db = await sqlite.createConnection({
      database: 'yesentregas',
      encrypted: false,
      mode: 'no-encryption',
      version: 1,
    });

    await db.open();

    // Query para insertar en la tabla `log`
    const query = `
      INSERT INTO log (id, json_accion, aplicado)
      VALUES (?, ?, ?);
    `;
    const values = [
      logData.id, // ID único para el registro
      JSON.stringify(logData.json_accion), // Convertir el JSON a texto para almacenarlo
      logData.aplicado, // Estado de "aplicado" (1 o 0)
    ];

    const result = await db.run({ statement: query, values });
    console.log('Log insertado:', result);

    await sqlite.closeConnection({ database: 'yesentregas' });

  } catch (error) {
    console.error('Error al insertar log:', error);
  }
};
