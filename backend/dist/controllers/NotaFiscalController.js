"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotaFiscalController = void 0;
const NotaFiscalService_1 = require("../services/NotaFiscalService");
const response_1 = require("../utils/response");
const notaFiscalService = new NotaFiscalService_1.NotaFiscalService();
class NotaFiscalController {
    parseStringListFilter(raw) {
        if (raw == null) {
            return [];
        }
        const parts = Array.isArray(raw)
            ? raw.flatMap((item) => String(item || '').split(','))
            : String(raw || '').split(',');
        return parts.map((item) => item.trim()).filter(Boolean);
    }
    parseNumberListFilter(raw) {
        const values = this.parseStringListFilter(raw)
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item));
        return Array.from(new Set(values));
    }
    buildFilters(query) {
        const statusValues = this.parseStringListFilter(query.status);
        const dataInicio = String(query.dataInicio || '').trim();
        const dataFim = String(query.dataFim || '').trim();
        return {
            status: statusValues[0] || undefined,
            obraId: this.parseNumberListFilter(query.obraId),
            programa: this.parseStringListFilter(query.programa),
            classificacao: this.parseStringListFilter(query.classificacao),
            orcadoNaoOrcado: this.parseStringListFilter(query.orcadoNaoOrcado),
            projeto: this.parseStringListFilter(query.projeto),
            dataInicio: dataInicio || undefined,
            dataFim: dataFim || undefined,
        };
    }
    async create(req, res) {
        try {
            const notaFiscal = await notaFiscalService.create(req.body);
            res.status(201).json((0, response_1.successResponse)('Nota Fiscal criada com sucesso', notaFiscal));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findById(req, res) {
        try {
            const notaFiscal = await notaFiscalService.findById(parseInt(req.params.id));
            if (!notaFiscal) {
                res.status(404).json((0, response_1.errorResponse)('Nota Fiscal não encontrada'));
                return;
            }
            res.status(200).json((0, response_1.successResponse)('Nota Fiscal encontrada', notaFiscal));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const filters = this.buildFilters(req.query);
            const result = await notaFiscalService.findAll(page, pageSize, filters);
            res.status(200).json((0, response_1.successResponse)('Notas Fiscais listadas com sucesso', {
                ...result,
                page,
                pageSize,
                totalPages: Math.ceil(result.total / pageSize),
            }));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async update(req, res) {
        try {
            const notaFiscal = await notaFiscalService.update(parseInt(req.params.id), req.body);
            res.status(200).json((0, response_1.successResponse)('Nota Fiscal atualizada com sucesso', notaFiscal));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async delete(req, res) {
        try {
            await notaFiscalService.delete(parseInt(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async deleteLote(req, res) {
        try {
            const ids = req.body?.notasFiscaisIds;
            if (!Array.isArray(ids) || !ids.length) {
                res.status(400).json((0, response_1.errorResponse)('Informe ao menos uma NF para exclusão em lote'));
                return;
            }
            const count = await notaFiscalService.deleteLote({ notasFiscaisIds: ids.map((id) => Number(id)) });
            res.status(200).json((0, response_1.successResponse)('Notas Fiscais excluídas com sucesso', { totalExcluidas: count }));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async deleteAll(req, res) {
        try {
            const count = await notaFiscalService.deleteAll();
            res.status(200).json((0, response_1.successResponse)('Todas as Notas Fiscais foram excluídas com sucesso', { totalExcluidas: count }));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async classificar(req, res) {
        try {
            if (!req.user) {
                res.status(401).json((0, response_1.errorResponse)('Usuário não autenticado'));
                return;
            }
            const classificacao = await notaFiscalService.classificarNF({
                ...req.body,
                notaFiscalId: parseInt(req.params.id),
            }, req.user.id);
            res.status(201).json((0, response_1.successResponse)('Nota Fiscal classificada com sucesso', classificacao));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async classificarLote(req, res) {
        try {
            if (!req.user) {
                res.status(401).json((0, response_1.errorResponse)('Usuário não autenticado'));
                return;
            }
            const result = await notaFiscalService.classificarLote(req.body, req.user.id);
            res.status(201).json((0, response_1.successResponse)('Notas Fiscais classificadas em lote com sucesso', result));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async importarExcel(req, res) {
        try {
            const file = req.file;
            if (!file?.buffer) {
                res.status(400).json((0, response_1.errorResponse)('Arquivo Excel não enviado'));
                return;
            }
            const result = await notaFiscalService.importarExcel(file.buffer);
            res.status(201).json((0, response_1.successResponse)('Planilha importada com sucesso', result));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async baixarTemplateExcel(req, res) {
        try {
            const fileBuffer = await notaFiscalService.gerarTemplateExcel();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="modelo-notas-fiscais.xlsx"');
            res.status(200).send(fileBuffer);
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message || 'Erro ao gerar template Excel'));
        }
    }
    async exportarExcel(req, res) {
        try {
            const filters = this.buildFilters(req.query);
            const fileBuffer = await notaFiscalService.exportarExcel(1000, filters);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="notas-fiscais-exportacao.xlsx"');
            res.status(200).send(fileBuffer);
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message || 'Erro ao exportar Excel'));
        }
    }
}
exports.NotaFiscalController = NotaFiscalController;
//# sourceMappingURL=NotaFiscalController.js.map