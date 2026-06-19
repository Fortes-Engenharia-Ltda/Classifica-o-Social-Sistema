"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObraService = void 0;
const ObraRepository_1 = require("../repositories/ObraRepository");
const SqlServerDProjetosService_1 = require("./SqlServerDProjetosService");
class ObraService {
    constructor() {
        this.obraRepository = new ObraRepository_1.ObraRepository();
        this.sqlServerDProjetosService = new SqlServerDProjetosService_1.SqlServerDProjetosService();
    }
    construirCodigo(row, index) {
        const codigoBase = (row.idCentroCusto || row.projeto || '').trim();
        if (codigoBase) {
            return codigoBase;
        }
        const fallbackProjeto = (row.projeto || 'SEM-PROJETO').trim().replace(/\s+/g, '-').toUpperCase();
        return `${fallbackProjeto}-${index + 1}`;
    }
    async create(data) {
        // Validar se código já existe
        const existe = await this.obraRepository.findByCodigo(data.codigoObra);
        if (existe) {
            throw new Error('Código de obra já cadastrado');
        }
        return this.obraRepository.create(data);
    }
    async findById(id) {
        return this.obraRepository.findById(id);
    }
    async findAll(page = 1, pageSize = 10, search = '', status = 'all', sortBy = 'dataCriacao', sortOrder = 'desc') {
        return this.obraRepository.findAll(page, pageSize, search, status, sortBy, sortOrder);
    }
    async syncFromDProjetos() {
        const rows = await this.sqlServerDProjetosService.buscarDProjetos();
        let processadas = 0;
        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            const codigoObra = this.construirCodigo(row, i);
            const nomeObra = (row.projeto || row.descricao || codigoObra).trim();
            const statusAtivo = row.ativo === 0 ? false : true;
            await this.obraRepository.upsertByCodigo({
                codigoObra,
                nomeObra,
                cidade: undefined,
                centroCusto: row.idCentroCusto || undefined,
                status: statusAtivo,
                idCentroCusto: row.idCentroCusto || undefined,
                idUN: row.idUN || undefined,
                un: row.un || undefined,
                descricao: row.descricao || undefined,
                projeto: row.projeto || undefined,
                local: row.local || undefined,
                cliente: row.cliente || undefined,
                gerente: row.gerente || undefined,
                gestor: row.gestor || undefined,
            });
            processadas += 1;
        }
        return {
            totalLidas: rows.length,
            totalSincronizadas: processadas,
        };
    }
    async update(id, data) {
        return this.obraRepository.update(id, data);
    }
    async delete(id) {
        return this.obraRepository.delete(id);
    }
}
exports.ObraService = ObraService;
//# sourceMappingURL=ObraService.js.map