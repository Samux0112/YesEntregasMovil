import { CapacitorSQLite } from '@capacitor-community/sqlite';

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
    await sqlite.closeConnection({ database: 'yesentregas' });

  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
};

export default initializeDatabase;
