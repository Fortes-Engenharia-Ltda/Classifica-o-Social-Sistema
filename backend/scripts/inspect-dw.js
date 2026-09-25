// Localiza a view vw_notas_fiscais no SQL Server e mostra suas colunas e uma amostra.
// Uso: cd backend && node scripts/inspect-dw.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sql = require('mssql');

const cfg = (database) => ({
  server: process.env.SQLSERVER_HOST,
  port: Number(process.env.SQLSERVER_PORT || 1433),
  database,
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  options: { encrypt: true },
  requestTimeout: 60000,
});

(async () => {
  const master = await new sql.ConnectionPool(cfg('master')).connect();
  const dbs = (await master.request().query('SELECT name FROM sys.databases')).recordset.map((r) => r.name);
  await master.close();
  console.log('Bancos:', dbs);

  for (const db of dbs.filter((n) => n !== 'master')) {
    let pool;
    try {
      pool = await new sql.ConnectionPool(cfg(db)).connect();
      const views = (
        await pool.request().query(
          "SELECT s.name AS sch, v.name FROM sys.views v JOIN sys.schemas s ON s.schema_id = v.schema_id WHERE v.name = 'vw_notas_fiscais'"
        )
      ).recordset;
      for (const v of views) {
        const full = `[${v.sch}].[${v.name}]`;
        console.log(`\n=== ${db}.${full} ===`);
        const cols = await pool.request().query(
          `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${v.sch}' AND TABLE_NAME='${v.name}' ORDER BY ORDINAL_POSITION`
        );
        console.table(cols.recordset);
        const sample = await pool.request().query(`SELECT TOP 3 * FROM ${full}`);
        console.log(JSON.stringify(sample.recordset, null, 2));
        const total = await pool.request().query(`SELECT COUNT(*) AS total FROM ${full}`);
        console.log('Total de linhas:', total.recordset[0].total);
      }
    } catch (e) {
      console.log(db, 'ERRO:', e.message);
    } finally {
      if (pool) await pool.close();
    }
  }
})().catch((e) => console.error(e.message));
