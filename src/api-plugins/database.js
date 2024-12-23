import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import Swal from 'sweetalert2';

const initializeDatabase = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const sqlite = CapacitorSQLite;

      // Intentar crear la conexión
      const db = await sqlite.createConnection({
        database: 'yesentregas',
        encrypted: false,
        mode: 'no-encryption',
        version: 1,
      });

      // Intentar abrir la base de datos
      await db.open();

      // Verificar si las tablas ya existen
      const result = await db.execute(`SELECT name FROM sqlite_master WHERE type='table'`);
      
      if (result.values.length === 0) {
        // Si no hay tablas, crearlas
        const createTablesQuery = `
          CREATE TABLE IF NOT EXISTS etiquetas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parametro VARCHAR(25),
            valor VARCHAR(500)
          );

          CREATE TABLE IF NOT EXISTS entregas (
            kunag VARCHAR(30),
            vbeln VARCHAR(20),
            posnr VARCHAR(10),
            matnr VARCHAR(30),
            arktx VARCHAR(255),
            fkimg NUMERIC(10, 3),
            bzirk VARCHAR(20),
            entregado NUMERIC(10,3),
            aplicado NUMERIC(1)
          );

          CREATE TABLE IF NOT EXISTS clientes (
            kunnr VARCHAR(11),
            name1 VARCHAR(100),
            name2 VARCHAR(100),
            stras VARCHAR(100),
            depto VARCHAR(60),
            munic VARCHAR(60),
            telf1 VARCHAR(80),
            latitud VARCHAR(25),
            longitud VARCHAR(25),
            modificado NUMERIC(1)
          );

          CREATE TABLE IF NOT EXISTS log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            json_accion TEXT,
            aplicado NUMERIC(1)
          );
        `;

        await db.execute(createTablesQuery);
        console.log('Base de datos inicializada y tablas creadas');

        Swal.fire({
          title: '¡Base de datos creada!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });

        // Exportar la base de datos si es necesario
        await exportDatabase(sqlite);
      } else {
        // Si las tablas ya existen
        console.log('La base de datos ya existe');
        Swal.fire({
          title: 'La base de datos ya existe',
          icon: 'info',
          timer: 2000,
          showConfirmButton: false,
        });
      }

      // Cierra la conexión
      await sqlite.closeConnection({ database: 'yesentregas' });
    } else {
      console.log('No está corriendo en un dispositivo nativo, no se puede inicializar la base de datos');
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    console.error('Stack Trace:', error.stack);

    Swal.fire({
      title: 'Error',
      text: `No se pudo crear la base de datos. Detalles: ${error.message}`,
      icon: 'error',
      confirmButtonText: 'Intentar de nuevo',
    });
  }
};

const exportDatabase = async (sqlite) => {
  try {
    const dbLocation = await sqlite.getDatabaseLocation();
    console.log('Ubicación de la base de datos:', dbLocation);
    const databasePath = `${dbLocation}/yesentregas.db`;

    const targetPath = `${Directory.Documents}/yesentregas.db`;

    await Filesystem.copy({
      from: databasePath,
      to: targetPath,
      directory: Directory.Data,
    });

    console.log('Base de datos exportada a:', targetPath);
  } catch (error) {
    console.error('Error al exportar la base de datos:', error.message);
    console.error('Stack Trace:', error.stack);
  }
};

export default initializeDatabase;
