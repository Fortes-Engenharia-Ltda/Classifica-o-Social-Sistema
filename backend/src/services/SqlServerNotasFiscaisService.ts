import sql from 'mssql';
import { config } from '../config';

export interface VwNotaFiscalRow {
  idLancamento: number | null;
  idFilial: number | null;
  obraId: string | null;
  idPlanoContas: string | null;
  ref: number | null;
  idFornecedor: number | null;
  fornecedor: string | null;
  cnpj: string | null;
  numeroNF: string | null;
  tipoDocumento: string | null;
  tipoDocumentoBaixa: string | null;
  dataEmissao: Date | null;
  dataPagamento: Date | null;
  valor: number | null;
}

// Lê a view dbo.vw_notas_fiscais do banco de staging (dados do Mega já filtrados
// pelas contas do Fortificar: 2200101001 / 2200101002).
export class SqlServerNotasFiscaisService {
  private validarConfig(): void {
    const { host, stagingDatabase, user, password } = config.sqlServer;

    if (!host || !stagingDatabase || !user || !password) {
      throw new Error(
        'Configuração SQL Server incompleta. Defina SQLSERVER_HOST, SQLSERVER_STAGING_DATABASE, SQLSERVER_USER e SQLSERVER_PASSWORD.',
      );
    }
  }

  async buscarNotasFiscais(): Promise<VwNotaFiscalRow[]> {
    this.validarConfig();

    const pool = new sql.ConnectionPool({
      server: config.sqlServer.host,
      port: config.sqlServer.port,
      database: config.sqlServer.stagingDatabase,
      user: config.sqlServer.user,
      password: config.sqlServer.password,
      options: {
        encrypt: config.sqlServer.encrypt,
        trustServerCertificate: config.sqlServer.trustServerCertificate,
      },
      // A view faz vários joins sobre as tabelas do Mega e pode demorar alguns minutos.
      requestTimeout: 10 * 60 * 1000,
      pool: {
        max: 2,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    });

    await pool.connect();

    try {
      const result = await pool.request().query(`
        SELECT
          idLancamento,
          idFilial,
          obra_id,
          idPlanoContas,
          ref,
          idFornecedor,
          fornecedor,
          cnpj,
          numero_nf,
          tipoDocumento,
          tipoDocumentoBaixa,
          data_emissao,
          data_pagamento,
          valor
        FROM dbo.vw_notas_fiscais
        ORDER BY idLancamento, obra_id, ref, numero_nf
      `);

      return (result.recordset || []).map((row: any) => ({
        idLancamento: row.idLancamento != null ? Number(row.idLancamento) : null,
        idFilial: row.idFilial != null ? Number(row.idFilial) : null,
        obraId: row.obra_id ?? null,
        idPlanoContas: row.idPlanoContas ?? null,
        ref: row.ref != null ? Number(row.ref) : null,
        idFornecedor: row.idFornecedor != null ? Number(row.idFornecedor) : null,
        fornecedor: row.fornecedor ?? null,
        cnpj: row.cnpj ?? null,
        numeroNF: row.numero_nf ?? null,
        tipoDocumento: row.tipoDocumento ?? null,
        tipoDocumentoBaixa: row.tipoDocumentoBaixa ?? null,
        dataEmissao: row.data_emissao ?? null,
        dataPagamento: row.data_pagamento ?? null,
        valor: row.valor != null ? Number(row.valor) : null,
      }));
    } finally {
      await pool.close();
    }
  }
}
