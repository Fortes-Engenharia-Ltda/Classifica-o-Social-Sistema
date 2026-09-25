import sql from 'mssql';
import { config } from '../config';

export interface DProjetoRow {
  idCentroCusto: string | null;
  idUN: string | null;
  un: string | null;
  descricao: string | null;
  projeto: string | null;
  local: string | null;
  cliente: string | null;
  gerente: string | null;
  gestor: string | null;
  ativo: number | null;
}

export class SqlServerDProjetosService {
  private validarConfig(): void {
    const { host, database, user, password } = config.sqlServer;

    if (!host || !database || !user || !password) {
      throw new Error(
        'Configuração SQL Server incompleta. Defina SQLSERVER_HOST, SQLSERVER_DATABASE, SQLSERVER_USER e SQLSERVER_PASSWORD.',
      );
    }
  }

  async buscarDProjetos(): Promise<DProjetoRow[]> {
    this.validarConfig();

    const pool = new sql.ConnectionPool({
      server: config.sqlServer.host,
      port: config.sqlServer.port,
      database: config.sqlServer.database,
      user: config.sqlServer.user,
      password: config.sqlServer.password,
      options: {
        encrypt: config.sqlServer.encrypt,
        trustServerCertificate: config.sqlServer.trustServerCertificate,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    });

    await pool.connect();

    try {
      const result = await pool.request().query(`
        SELECT
          CAST(idCentroCusto AS NVARCHAR(50)) AS idCentroCusto,
          CAST(idUN AS NVARCHAR(50)) AS idUN,
          CAST(UN AS NVARCHAR(100)) AS un,
          CAST(Descricao AS NVARCHAR(MAX)) AS descricao,
          CAST(Projeto AS NVARCHAR(200)) AS projeto,
          CAST(Local AS NVARCHAR(200)) AS local,
          CAST(Cliente AS NVARCHAR(150)) AS cliente,
          CAST(Gerente AS NVARCHAR(120)) AS gerente,
          CAST(Gestor AS NVARCHAR(120)) AS gestor,
          TRY_CAST([Ativo] AS INT) AS ativo
        FROM dbo.dProjetos
      `);

      return (result.recordset || []).map((row: any) => ({
        idCentroCusto: row.idCentroCusto ?? null,
        idUN: row.idUN ?? null,
        un: row.un ?? null,
        descricao: row.descricao ?? null,
        projeto: row.projeto ?? null,
        local: row.local ?? null,
        cliente: row.cliente ?? null,
        gerente: row.gerente ?? null,
        gestor: row.gestor ?? null,
        ativo: row.ativo ?? null,
      }));
    } finally {
      await pool.close();
    }
  }
}
