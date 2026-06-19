"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramaController = void 0;
const ProgramaService_1 = require("../services/ProgramaService");
const response_1 = require("../utils/response");
const programaService = new ProgramaService_1.ProgramaService();
class ProgramaController {
    async create(req, res) {
        try {
            const programa = await programaService.create(req.body);
            res.status(201).json((0, response_1.successResponse)('Programa criado com sucesso', programa));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findById(req, res) {
        try {
            const programa = await programaService.findById(parseInt(req.params.id));
            if (!programa) {
                res.status(404).json((0, response_1.errorResponse)('Programa não encontrado'));
                return;
            }
            res.status(200).json((0, response_1.successResponse)('Programa encontrado', programa));
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
            const sortBy = sortByParam === 'id' || sortByParam === 'nome' || sortByParam === 'codigo' || sortByParam === 'dataCriacao'
                ? sortByParam
                : 'dataCriacao';
            const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';
            const result = await programaService.findAll(page, pageSize, search, status, sortBy, sortOrder);
            res.status(200).json((0, response_1.successResponse)('Programas listados com sucesso', {
                ...result,
                page,
                pageSize,
                totalPages: Math.ceil(result.total / pageSize),
                filters: { search, status, sortBy, sortOrder },
            }));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async update(req, res) {
        try {
            const programa = await programaService.update(parseInt(req.params.id), req.body);
            res.status(200).json((0, response_1.successResponse)('Programa atualizado com sucesso', programa));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async delete(req, res) {
        try {
            await programaService.delete(parseInt(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
}
exports.ProgramaController = ProgramaController;
//# sourceMappingURL=ProgramaController.js.map