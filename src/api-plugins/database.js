import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Directory, Filesystem } from '@capacitor/filesystem';
import Swal from 'sweetalert2';

const initializeDatabase = async () => {
  try {
    const sqlite = CapacitorSQLite;

    // Abrimos o creamos la base de datos
    const db = await sqlite.createConnection({
      database: 'yesentregas',
      encrypted: false,
      mode: 'no-encryption',
      version: 1,
    });

    await db.open();

    // Creación de las tablas
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

    // Verifica si las tablas fueron creadas correctamente
    const result = await db.execute(
      `SELECT name FROM sqlite_master WHERE type='table'`
    );
    console.log('Tablas existentes:', result.values);

    // Muestra mensaje de éxito
    Swal.fire({
      title: '¡Base de datos creada!',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });

    // Exportar la base de datos si es necesario
    await exportDatabase(sqlite);

    // Cierra la conexión
    await sqlite.closeConnection({ database: 'yesentregas' });

  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);

    // Muestra mensaje de error si no se puede crear la base de datos
    Swal.fire({
      title: 'Error',
      text: 'No se pudo crear la base de datos.',
      icon: 'error',
      confirmButtonText: 'Intentar de nuevo',
    });
  }
};

const exportDatabase = async (sqlite) => {
  try {
    const dbLocation = await sqlite.getDatabaseLocation();
    const databasePath = `${dbLocation}/yesentregas.db`;

    // Copia el archivo de base de datos al almacenamiento accesible
    await Filesystem.copy({
      from: databasePath,
      to: `${Directory.Documents}/yesentregas.db`,
      directory: Directory.Data,
    });

    console.log(
      'Base de datos exportada a:',
      `${Directory.Documents}/yesentregas.db`
    );
  } catch (error) {
    console.error('Error al exportar la base de datos:', error);
  }
};

export default initializeDatabase;
