"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassificacaoController = void 0;
const ClassificacaoService_1 = require("../services/ClassificacaoService");
const response_1 = require("../utils/response");
const classificacaoService = new ClassificacaoService_1.ClassificacaoService();
class ClassificacaoController {
    async create(req, res) {
        try {
            const classificacao = await classificacaoService.create(req.body);
            res.status(201).json((0, response_1.successResponse)('Classificação criada com sucesso', classificacao));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findById(req, res) {
        try {
            const classificacao = await classificacaoService.findById(parseInt(req.params.id));
            if (!classificacao) {
                res.status(404).json((0, response_1.errorResponse)('Classificação não encontrada'));
                return;
            }
            res.status(200).json((0, response_1.successResponse)('Classificação encontrada', classificacao));
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
            const result = await classificacaoService.findAll(page, pageSize, search, status, sortBy, sortOrder);
            res.status(200).json((0, response_1.successResponse)('Classificações listadas com sucesso', {
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
            const classificacao = await classificacaoService.update(parseInt(req.params.id), req.body);
            res.status(200).json((0, response_1.successResponse)('Classificação atualizada com sucesso', classificacao));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async delete(req, res) {
        try {
            await classificacaoService.delete(parseInt(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
}
exports.ClassificacaoController = ClassificacaoController;
//# sourceMappingURL=ClassificacaoController.js.map