"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObraController = void 0;
const ObraService_1 = require("../services/ObraService");
const response_1 = require("../utils/response");
const obraService = new ObraService_1.ObraService();
class ObraController {
    async create(req, res) {
        try {
            const obra = await obraService.create(req.body);
            res.status(201).json((0, response_1.successResponse)('Obra criada com sucesso', obra));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findById(req, res) {
        try {
            const obra = await obraService.findById(parseInt(req.params.id));
            if (!obra) {
                res.status(404).json((0, response_1.errorResponse)('Obra não encontrada'));
                return;
            }
            res.status(200).json((0, response_1.successResponse)('Obra encontrada', obra));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const search = String(req.query.search || '').trim();
            const statusParam = String(req.query.status || 'all').toLowerCase();
            const sortByParam = String(req.query.sortBy || 'dataCriacao');
            const sortOrderParam = String(req.query.sortOrder || 'desc').toLowerCase();
            const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
            const sortBy = sortByParam === 'id' ||
                sortByParam === 'codigoObra' ||
                sortByParam === 'nomeObra' ||
                sortByParam === 'status' ||
                sortByParam === 'projeto' ||
                sortByParam === 'idCentroCusto' ||
                sortByParam === 'centroCusto' ||
                sortByParam === 'idUN' ||
                sortByParam === 'un' ||
                sortByParam === 'local' ||
                sortByParam === 'cliente' ||
                sortByParam === 'gerente' ||
                sortByParam === 'gestor' ||
                sortByParam === 'dataCriacao'
                ? sortByParam
                : 'dataCriacao';
            const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';
            const result = await obraService.findAll(page, pageSize, search, status, sortBy, sortOrder);
            res.status(200).json((0, response_1.successResponse)('Obras listadas com sucesso', {
                ...result,
                page,
                pageSize,
                totalPages: Math.ceil(result.total / pageSize),
                filters: {
                    search,
                    status,
                    sortBy,
                    sortOrder,
                },
            }));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async syncDProjetos(_req, res) {
        try {
            const resultado = await obraService.syncFromDProjetos();
            res.status(200).json((0, response_1.successResponse)('Tabela dProjetos sincronizada com sucesso', resultado));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async update(req, res) {
        try {
            const obra = await obraService.update(parseInt(req.params.id), req.body);
            res.status(200).json((0, response_1.successResponse)('Obra atualizada com sucesso', obra));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async delete(req, res) {
        try {
            await obraService.delete(parseInt(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
}
exports.ObraController = ObraController;
//# sourceMappingURL=ObraController.js.map