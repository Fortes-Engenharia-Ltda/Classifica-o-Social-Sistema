"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjetoController = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const ProjetoService_1 = require("../services/ProjetoService");
const response_1 = require("../utils/response");
const database_1 = __importDefault(require("../config/database"));
const prismaCircuitBreaker_1 = require("../utils/prismaCircuitBreaker");
const projetoService = new ProjetoService_1.ProjetoService();
class ProjetoController {
    async create(req, res) {
        try {
            const projeto = await projetoService.create(req.body);
            res.status(201).json((0, response_1.successResponse)('Projeto criado com sucesso', projeto));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async uploadImagem(req, res) {
        try {
            const arquivo = req.file;
            if (!arquivo) {
                res.status(400).json((0, response_1.errorResponse)('Nenhum arquivo enviado'));
                return;
            }
            const urlImagem = `/uploads/projetos-imagens/${arquivo.filename}`;
            res.status(200).json((0, response_1.successResponse)('Imagem enviada com sucesso', { url: urlImagem }));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findById(req, res) {
        try {
            const projeto = await projetoService.findById(parseInt(req.params.id));
            if (!projeto) {
                res.status(404).json((0, response_1.errorResponse)('Projeto não encontrado'));
                return;
            }
            res.status(200).json((0, response_1.successResponse)('Projeto encontrado', projeto));
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
            const result = await projetoService.findAll(page, pageSize, search, status, sortBy, sortOrder);
            res.status(200).json((0, response_1.successResponse)('Projetos listados com sucesso', {
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
            const projeto = await projetoService.update(parseInt(req.params.id), req.body);
            res.status(200).json((0, response_1.successResponse)('Projeto atualizado com sucesso', projeto));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async delete(req, res) {
        try {
            await projetoService.delete(parseInt(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async listarInstituicoesPorProjeto(req, res) {
        try {
            const projetoId = parseInt(req.params.id, 10);
            if (!Number.isFinite(projetoId)) {
                res.status(400).json((0, response_1.errorResponse)('Projeto inválido'));
                return;
            }
            const contratosPath = path_1.default.resolve(process.cwd(), 'data', 'instituicoes-contratos-fallback.json');
            const instituicoesPath = path_1.default.resolve(process.cwd(), 'data', 'instituicoes-cadastros-fallback.json');
            let contratos = [];
            try {
                const raw = await promises_1.default.readFile(contratosPath, 'utf8');
                contratos = JSON.parse(raw);
            }
            catch {
                contratos = [];
            }
            const contratosDoProjeto = contratos.filter((c) => Number(c.projetoId) === projetoId);
            if (contratosDoProjeto.length === 0) {
                res.status(200).json((0, response_1.successResponse)('Nenhuma instituição encontrada', []));
                return;
            }
            const instituicaoIds = [...new Set(contratosDoProjeto
                    .map((c) => Number(c.instituicaoIdReferencia))
                    .filter((id) => id > 0))];
            let instituicoesDb = [];
            try {
                instituicoesDb = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(() => database_1.default.instituicaoSocial.findMany({
                    where: { id: { in: instituicaoIds } },
                    select: { id: true, instituicao: true, liberadoAdmin: true },
                }), async () => []);
            }
            catch {
                instituicoesDb = [];
            }
            let instituicoesFallback = [];
            try {
                const raw = await promises_1.default.readFile(instituicoesPath, 'utf8');
                instituicoesFallback = JSON.parse(raw);
            }
            catch {
                instituicoesFallback = [];
            }
            const hoje = new Date();
            const resultado = instituicaoIds.map((id) => {
                const contratosDaInst = contratosDoProjeto.filter((c) => Number(c.instituicaoIdReferencia) === id);
                const contratoAtivo = contratosDaInst.find((c) => {
                    const fim = c.dataFim ? new Date(c.dataFim) : null;
                    return fim && fim >= hoje;
                });
                const dbItem = instituicoesDb.find((i) => i.id === id);
                const fbItem = instituicoesFallback.find((i) => Number(i.instituicaoIdReferencia) === id || Number(i.id) === id);
                return {
                    instituicaoId: id,
                    nomeInstituicao: dbItem?.instituicao
                        || fbItem?.nomeFantasia
                        || fbItem?.nome
                        || `Instituição #${id}`,
                    status: dbItem?.liberadoAdmin ? 'APROVADO' : fbItem?.statusRevisao || 'ATIVO',
                    contratoAtivo: !!contratoAtivo,
                    quantidadeContratos: contratosDaInst.length,
                };
            });
            res.status(200).json((0, response_1.successResponse)('Instituições listadas com sucesso', resultado));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
}
exports.ProjetoController = ProjetoController;
//# sourceMappingURL=ProjetoController.js.map