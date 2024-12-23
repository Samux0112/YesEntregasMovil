import { CapacitorSQLite } from '@capacitor-community/sqlite';
//este archivo servira para enviar la informacion al servidor a la base de postgresql que esta en el enpoint upload o como se llame hay que validar si se puede subir esa info de localstorage a un enpoint de una api
export const syncWithServer = async () => {
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

    // Obtener datos no sincronizados
    const query = 'SELECT * FROM log WHERE aplicado = 0';
    const result = await db.query({ statement: query });

    if (result.values.length > 0) {
      console.log('Datos no sincronizados:', result.values);

      // Enviar los datos al servidor
    //   const response = await axios.post('https://api.yesentregas.com/uploadentregas/', result.values);
    //   console.log('Sincronización exitosa:', response.data);

      // Marcar los datos como sincronizados
      const updateQuery = 'UPDATE log SET aplicado = 1 WHERE aplicado = 0';
      await db.run({ statement: updateQuery });
    } else {
      console.log('No hay datos para sincronizar');
    }

    await sqlite.closeConnection({ database: 'yesentregas' });

  } catch (error) {
    console.error('Error al sincronizar con el servidor:', error);
  }
};
