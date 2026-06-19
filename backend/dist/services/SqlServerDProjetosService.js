"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlServerDProjetosService = void 0;
const mssql_1 = __importDefault(require("mssql"));
const config_1 = require("../config");
class SqlServerDProjetosService {
    validarConfig() {
        const { host, database, user, password } = config_1.config.sqlServer;
        if (!host || !database || !user || !password) {
            throw new Error('Configuração SQL Server incompleta. Defina SQLSERVER_HOST, SQLSERVER_DATABASE, SQLSERVER_USER e SQLSERVER_PASSWORD.');
        }
    }
    async buscarDProjetos() {
        this.validarConfig();
        const pool = new mssql_1.default.ConnectionPool({
            server: config_1.config.sqlServer.host,
            port: config_1.config.sqlServer.port,
            database: config_1.config.sqlServer.database,
            user: config_1.config.sqlServer.user,
            password: config_1.config.sqlServer.password,
            options: {
                encrypt: config_1.config.sqlServer.encrypt,
                trustServerCertificate: config_1.config.sqlServer.trustServerCertificate,
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
            return (result.recordset || []).map((row) => ({
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
        }
        finally {
            await pool.close();
        }
    }
}
exports.SqlServerDProjetosService = SqlServerDProjetosService;
//# sourceMappingURL=SqlServerDProjetosService.js.map