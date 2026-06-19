"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotaFiscalService = void 0;
const NotaFiscalRepository_1 = require("../repositories/NotaFiscalRepository");
const database_1 = __importDefault(require("../config/database"));
const XLSX = __importStar(require("xlsx"));
const prismaCircuitBreaker_1 = require("../utils/prismaCircuitBreaker");
const notaFiscalMetadata_1 = require("../utils/notaFiscalMetadata");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const ORCADO_FALLBACK_PATH = path_1.default.resolve(process.cwd(), 'data', 'orcado-nao-orcado-fallback.json');
class NotaFiscalService {
    constructor() {
        this.notaFiscalRepository = new NotaFiscalRepository_1.NotaFiscalRepository();
    }
    normalizeLookup(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .trim()
            .toLowerCase();
    }
    async getOrcadoNaoOrcadoMapAtivos() {
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
            const rows = await database_1.default.orcadoNaoOrcado.findMany({
                where: { status: true },
                select: { nome: true },
            });
            const map = new Map();
            rows.forEach((row) => {
                const nome = String(row.nome || '').trim();
                if (nome) {
                    map.set(this.normalizeLookup(nome), nome);
                }
            });
            return map;
        }, async () => {
            const fallback = await this.getOrcadoNaoOrcadoAtivos();
            const map = new Map();
            fallback.forEach((nome) => {
                const cleaned = String(nome || '').trim();
                if (cleaned) {
                    map.set(this.normalizeLookup(cleaned), cleaned);
                }
            });
            return map;
        });
    }
    async getClassificacaoContaByActionCode() {
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
            const rows = await database_1.default.classificacaoConta.findMany({
                where: { status: true },
                select: {
                    id: true,
                    codigoAcao: true,
                    orcadoNaoOrcado: {
                        select: { nome: true },
                    },
                },
            });
            const map = new Map();
            rows.forEach((row) => {
                const codigoAcao = Number(row.codigoAcao);
                const orcadoNaoOrcadoNome = String(row.orcadoNaoOrcado?.nome || '').trim();
                if (Number.isFinite(codigoAcao) && orcadoNaoOrcadoNome) {
                    map.set(codigoAcao, {
                        id: Number(row.id),
                        codigoAcao,
                        orcadoNaoOrcadoNome,
                    });
                }
            });
            return map;
        }, async () => new Map());
    }
    async resolveClassificacaoContaId(actionCode) {
        if (actionCode === undefined || actionCode === null) {
            return undefined;
        }
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
            const conta = await database_1.default.classificacaoConta.findFirst({
                where: {
                    status: true,
                    codigoAcao: Number(actionCode),
                },
                select: { id: true },
            });
            return conta?.id ? Number(conta.id) : undefined;
        }, async () => undefined);
    }
    async gerarTemplateExcel() {
        const options = await this.getOpcoesImportacao();
        const headers = [
            'ID',
            'Índice',
            'Cód. Documento',
            'Razão Social',
            'Valor',
            'Data de Pagamento',
            'Código de Ação',
            'Unidade de Negócio',
            'Orçado/Não Orçado',
            'Programa',
            'Instituição',
            'Projeto',
            'Classificação ATT',
            'Histórico',
            'Observações',
        ];
        const exemplo = [
            '1',
            '1',
            'NF-0001',
            'Fornecedor Exemplo LTDA',
            '1234.56',
            '10',
            '2026-06-01',
            'ENGENHARIA',
            options.orcadoNaoOrcado[0] || 'ORCADO',
            options.programas[0] || 'Programa Exemplo',
            options.instituicoes[0] || 'Instituição Exemplo',
            options.projetos[0] || 'Projeto Exemplo',
            options.classificacoes[0] || 'Classificação Exemplo',
            'Pagamento referente a servicos',
            'Use as opcoes da aba OpcoesSistema para os campos de classificacao',
        ];
        const worksheet = XLSX.utils.aoa_to_sheet([headers, exemplo]);
        const optionsWorksheet = XLSX.utils.aoa_to_sheet([
            [
                'Orçado/Não Orçado (ativos)',
                'Programas (ativos)',
                'Instituições (ativas)',
                'Projetos (ativos)',
                'Classificações ATT (ativas)',
            ],
            ...Array.from({ length: Math.max(options.orcadoNaoOrcado.length, options.programas.length, options.instituicoes.length, options.projetos.length, options.classificacoes.length) }).map((_, index) => [
                options.orcadoNaoOrcado[index] || '',
                options.programas[index] || '',
                options.instituicoes[index] || '',
                options.projetos[index] || '',
                options.classificacoes[index] || '',
            ]),
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ModeloImportacao');
        XLSX.utils.book_append_sheet(workbook, optionsWorksheet, 'OpcoesSistema');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    async exportarExcel(pageSize = 1000, filters) {
        const rows = [];
        let page = 1;
        let total = 0;
        do {
            const result = await this.findAll(page, pageSize, filters);
            total = result.total;
            rows.push(...result.notasFiscais);
            page += 1;
        } while (rows.length < total);
        const headers = [
            'ID',
            'Índice',
            'Cód. Documento',
            'Razão Social',
            'Valor',
            'Data de Pagamento',
            'Código de Ação',
            'Unidade de Negócio',
            'Período',
            'Localização',
            'Orçado/Não Orçado',
            'Programa',
            'Instituição',
            'Projeto',
            'Classificação ATT',
            'Histórico',
            'Observações',
        ];
        const dataRows = rows.map((nf) => [
            Number(nf.id || 0),
            nf.camposClassificacao?.indiceImportacao || '',
            nf.camposClassificacao?.codDocumento || nf.numeroNF || '',
            nf.camposClassificacao?.razaoSocial || nf.fornecedor || '',
            nf.actionCode || '',
            Number(nf.valor || 0),
            nf.camposClassificacao?.dataPagamento
                ? String(nf.camposClassificacao.dataPagamento).slice(0, 10)
                : String(nf.dataEmissao || '').slice(0, 10),
            nf.periodo || '',
            nf.localizacao || '',
            nf.camposClassificacao?.unidadeNegocio || '',
            nf.camposClassificacao?.orcadoNaoOrcado || '',
            nf.camposClassificacao?.programa || '',
            nf.camposClassificacao?.instituicao || '',
            nf.camposClassificacao?.projeto || '',
            nf.camposClassificacao?.classificacaoProjetoAtt || '',
            nf.camposClassificacao?.historico || '',
            nf.camposClassificacao?.observacoes || nf.observacao || '',
        ]);
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'NotasFiscais');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    async create(data) {
        // Validar se já existe NF com mesmo número
        const existe = await this.notaFiscalRepository.findByNumero(data.numeroNF);
        if (existe) {
            throw new Error('Nota fiscal com este número já existe');
        }
        const payload = { ...data };
        return this.notaFiscalRepository.create(payload);
    }
    async findById(id) {
        return this.notaFiscalRepository.findById(id);
    }
    async findAll(page = 1, pageSize = 10, filters) {
        return this.notaFiscalRepository.findAll(page, pageSize, filters);
    }
    async update(id, data) {
        return this.notaFiscalRepository.update(id, data);
    }
    async delete(id) {
        return this.notaFiscalRepository.delete(id);
    }
    async deleteLote(data) {
        if (!data.notasFiscaisIds?.length) {
            throw new Error('Informe ao menos uma NF para exclusão em lote');
        }
        return this.notaFiscalRepository.deleteMany(data.notasFiscaisIds);
    }
    async deleteAll() {
        return this.notaFiscalRepository.deleteAll();
    }
    async classificarNF(data, usuarioId) {
        // Verificar se NF existe
        const nf = await this.notaFiscalRepository.findById(data.notaFiscalId);
        if (!nf) {
            throw new Error('Nota fiscal não encontrada');
        }
        // Criar classificação
        const classificacao = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => database_1.default.classificacaoNF.create({
            data: {
                notaFiscalId: data.notaFiscalId,
                projetoId: data.projetoId,
                programaId: data.programaId,
                classificacaoId: data.classificacaoId,
                obraId: data.obraId,
                usuarioId,
            },
        }), async () => ({
            notaFiscalId: data.notaFiscalId,
            projetoId: data.projetoId,
            programaId: data.programaId,
            classificacaoId: data.classificacaoId,
            obraId: data.obraId,
            usuarioId,
            fallback: true,
        }));
        // Atualizar status da NF para CLASSIFICADA
        await this.notaFiscalRepository.update(data.notaFiscalId, { status: 'CLASSIFICADA' });
        return classificacao;
    }
    async classificarLote(data, usuarioId) {
        if (data.camposClassificacao) {
            const updates = await Promise.all(data.notasFiscaisIds.map((id) => this.notaFiscalRepository.update(id, {
                camposClassificacao: data.camposClassificacao,
            })));
            return {
                total: updates.length,
                classificacoes: updates,
            };
        }
        const classificacoes = await Promise.all(data.notasFiscaisIds.map((id) => this.classificarNF({
            notaFiscalId: id,
            projetoId: data.projetoId,
            programaId: data.programaId,
            classificacaoId: data.classificacaoId,
        }, usuarioId)));
        return {
            total: classificacoes.length,
            classificacoes,
        };
    }
    async importarExcel(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        if (!rows.length) {
            throw new Error('A planilha está vazia');
        }
        const obraPadrao = await this.getObraPadrao();
        const orcadoMapAtivos = await this.getOrcadoNaoOrcadoMapAtivos();
        const classificacaoContaByActionCode = await this.getClassificacaoContaByActionCode();
        let importadas = 0;
        let ignoradas = 0;
        for (const row of rows) {
            const numeroNF = this.normalizeString(row['Cód. Documento']) ||
                `NF-IMPORT-${Date.now().toString()}-${Math.floor(Math.random() * 1000)}`;
            const existe = await this.notaFiscalRepository.findByNumero(numeroNF);
            if (existe) {
                ignoradas += 1;
                continue;
            }
            const valor = this.toNumber(row.Valor);
            const dataPagamento = this.toISODate(row['Data de Pagamento']);
            const actionCode = this.toActionCode(row['Código de Ação']);
            const orcadoNaoOrcadoRaw = this.normalizeString(row['Orçado/Não Orçado']);
            const programa = this.normalizeString(row.Programa);
            const instituicao = this.normalizeString(row.Instituição);
            const projeto = this.normalizeString(row.Projeto);
            const classificacaoProjetoAtt = this.normalizeString(row['Classificação ATT']);
            const indiceImportacao = this.normalizeString(row['Índice']) || this.normalizeString(row.ID);
            const orcadoDigitadoNormalizado = this.normalizeLookup(orcadoNaoOrcadoRaw);
            const orcadoDigitadoCanonical = orcadoDigitadoNormalizado
                ? orcadoMapAtivos.get(orcadoDigitadoNormalizado) || null
                : null;
            const contaPorAcao = actionCode !== undefined ? classificacaoContaByActionCode.get(actionCode) : undefined;
            const orcadoAutomatico = contaPorAcao?.orcadoNaoOrcadoNome || null;
            let orcadoNaoOrcado = orcadoAutomatico || orcadoDigitadoCanonical;
            let removerClassificacao = false;
            if (orcadoNaoOrcadoRaw && !orcadoDigitadoCanonical) {
                removerClassificacao = true;
            }
            if (orcadoAutomatico && orcadoDigitadoCanonical) {
                const autoNorm = this.normalizeLookup(orcadoAutomatico);
                const manualNorm = this.normalizeLookup(orcadoDigitadoCanonical);
                if (autoNorm !== manualNorm) {
                    removerClassificacao = true;
                }
            }
            let camposClassificacao = {
                indiceImportacao,
                orcadoNaoOrcado,
                programa,
                instituicao,
                projeto,
                classificacaoProjetoAtt,
                unidadeNegocio: this.normalizeString(row['Unidade de Negócio']) || null,
                dataPagamento,
                razaoSocial: this.normalizeString(row['Razão Social']) || null,
                historico: this.normalizeString(row.Histórico) || null,
                valor,
                codDocumento: this.normalizeString(row['Cód. Documento']) || null,
                observacoes: this.normalizeString(row.Observações) || null,
            };
            if (removerClassificacao) {
                camposClassificacao = {
                    ...camposClassificacao,
                    orcadoNaoOrcado: null,
                    programa: null,
                    instituicao: null,
                    projeto: null,
                    classificacaoProjetoAtt: null,
                };
            }
            const status = (0, notaFiscalMetadata_1.hasPendenciaClassificacao)({
                camposObrigatorios: {
                    orcadoNaoOrcado: camposClassificacao.orcadoNaoOrcado,
                    programa: camposClassificacao.programa,
                    instituicao: camposClassificacao.instituicao,
                    projeto: camposClassificacao.projeto,
                    classificacaoProjetoAtt: camposClassificacao.classificacaoProjetoAtt,
                },
                camposOpcionais: {
                    indiceImportacao: camposClassificacao.indiceImportacao,
                    historico: camposClassificacao.historico,
                    unidadeNegocio: camposClassificacao.unidadeNegocio,
                    dataPagamento: camposClassificacao.dataPagamento,
                    razaoSocial: camposClassificacao.razaoSocial,
                    valor: camposClassificacao.valor,
                    codDocumento: camposClassificacao.codDocumento,
                    observacoes: camposClassificacao.observacoes,
                },
            })
                ? 'PENDENTE'
                : 'CLASSIFICADA';
            await this.notaFiscalRepository.create({
                numeroNF,
                fornecedor: this.normalizeString(row['Razão Social']) || undefined,
                cnpj: undefined,
                valor: valor ?? 0,
                dataEmissao: dataPagamento || new Date().toISOString(),
                obraId: obraPadrao.id,
                actionCode,
                status,
                origemImportacao: 'EXCEL',
                observacao: this.normalizeString(row.Observações) || undefined,
                camposClassificacao,
            });
            importadas += 1;
        }
        return {
            totalLinhas: rows.length,
            importadas,
            ignoradas,
        };
    }
    toActionCode(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return undefined;
        }
        if (parsed === 10 || parsed === 70) {
            return parsed;
        }
        return undefined;
    }
    normalizeString(value) {
        if (value === null || value === undefined) {
            return null;
        }
        const parsed = String(value).trim();
        return parsed.length ? parsed : null;
    }
    toNumber(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    toISODate(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        if (typeof value === 'number') {
            const utcDays = Math.floor(value - 25569);
            const utcValue = utcDays * 86400;
            const date = new Date(utcValue * 1000);
            if (!Number.isNaN(date.getTime())) {
                return date.toISOString();
            }
            return null;
        }
        const date = new Date(String(value));
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    async getObraPadrao() {
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
            const obra = await database_1.default.obra.findFirst({ orderBy: { id: 'asc' } });
            if (obra) {
                return obra;
            }
            return database_1.default.obra.create({
                data: {
                    codigoObra: `OBR-IMPORT-${Date.now()}`,
                    nomeObra: 'Obra padrão para importações',
                    cidade: 'Não informado',
                    centroCusto: 'IMPORT',
                    status: true,
                },
            });
        }, async () => ({
            id: 1,
            codigoObra: 'OBR-FALLBACK',
            nomeObra: 'Obra fallback local',
            cidade: null,
            centroCusto: null,
            idCentroCusto: null,
            idUN: null,
            un: null,
            descricao: null,
            projeto: null,
            local: null,
            cliente: null,
            gerente: null,
            gestor: null,
            status: true,
            dataCriacao: new Date(),
            dataAtualizacao: new Date(),
        }));
    }
    async getOpcoesImportacao() {
        const hoje = new Date();
        const [programas, projetos, classificacoes, instituicoes, orcadoNaoOrcado] = await Promise.all([
            (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
                const rows = await database_1.default.programa.findMany({
                    where: { status: true },
                    select: { nome: true },
                    orderBy: { nome: 'asc' },
                });
                return rows.map((r) => String(r.nome || '').trim()).filter(Boolean);
            }, async () => []),
            (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
                const rows = await database_1.default.projeto.findMany({
                    where: { status: true },
                    select: { nome: true },
                    orderBy: { nome: 'asc' },
                });
                return rows.map((r) => String(r.nome || '').trim()).filter(Boolean);
            }, async () => []),
            (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
                const rows = await database_1.default.classificacao.findMany({
                    where: { status: true },
                    select: { nome: true },
                    orderBy: { nome: 'asc' },
                });
                return rows.map((r) => String(r.nome || '').trim()).filter(Boolean);
            }, async () => []),
            (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
                const rows = await database_1.default.instituicaoSocial.findMany({
                    where: { liberadoAdmin: true },
                    select: { instituicao: true, dataFim: true },
                    orderBy: { instituicao: 'asc' },
                });
                return rows
                    .filter((r) => {
                    if (!r.dataFim) {
                        return true;
                    }
                    const dataFim = new Date(r.dataFim);
                    dataFim.setHours(23, 59, 59, 999);
                    return dataFim.getTime() >= hoje.getTime();
                })
                    .map((r) => String(r.instituicao || '').trim())
                    .filter(Boolean);
            }, async () => []),
            this.getOrcadoNaoOrcadoAtivos(),
        ]);
        const unique = (items) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
        return {
            orcadoNaoOrcado: unique(orcadoNaoOrcado),
            programas: unique(programas),
            instituicoes: unique(instituicoes),
            projetos: unique(projetos),
            classificacoes: unique(classificacoes),
        };
    }
    async getOrcadoNaoOrcadoAtivos() {
        try {
            const raw = await fs_1.promises.readFile(ORCADO_FALLBACK_PATH, 'utf-8');
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed
                .filter((item) => item && item.status === true)
                .map((item) => String(item.nome || '').trim())
                .filter(Boolean);
        }
        catch {
            return [];
        }
    }
}
exports.NotaFiscalService = NotaFiscalService;
//# sourceMappingURL=NotaFiscalService.js.map