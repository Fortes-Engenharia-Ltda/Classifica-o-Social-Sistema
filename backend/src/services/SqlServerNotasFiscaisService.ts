import sql from 'mssql';
import { config } from '../config';
import logger from '../config/logger';
import { NOTAS_FISCAIS_FORTIFICAR_SQL } from './sql/notasFiscaisFortificar';

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
      // O lote leva cerca de 30 segundos; a folga cobre o staging mais carregado.
      requestTimeout: 5 * 60 * 1000,
      pool: {
        max: 2,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    });

    await pool.connect();
    logger.info('Sincronizacao DW: conectado ao SQL Server, lendo notas das contas do Fortificar');
    const inicioConsulta = Date.now();

    try {
      const result = await pool.request().batch(NOTAS_FISCAIS_FORTIFICAR_SQL);

      logger.info('Sincronizacao DW: leitura das notas concluida', {
        linhas: result.recordset?.length ?? 0,
        segundos: Math.round((Date.now() - inicioConsulta) / 1000),
      });

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
