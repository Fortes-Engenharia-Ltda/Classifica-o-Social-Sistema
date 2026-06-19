"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const database_1 = __importDefault(require("../config/database"));
const response_1 = require("../utils/response");
const notaFiscalMetadata_1 = require("../utils/notaFiscalMetadata");
const NotaFiscalRepository_1 = require("../repositories/NotaFiscalRepository");
const prismaCircuitBreaker_1 = require("../utils/prismaCircuitBreaker");
const notaFiscalRepository = new NotaFiscalRepository_1.NotaFiscalRepository();
class DashboardController {
    constructor() {
        this.curvaProjetoLimit = 6;
    }
    async listarOrcadoNaoOrcadoAtivos() {
        try {
            const itens = await database_1.default.orcadoNaoOrcado.findMany({
                where: { status: true },
                select: { nome: true },
                orderBy: { nome: 'asc' },
            });
            return itens.map((item) => String(item.nome || '').trim()).filter(Boolean);
        }
        catch {
            return [];
        }
    }
    getRegiao(local) {
        const valor = String(local || '').trim().toUpperCase();
        if (!valor)
            return null;
        // Mapa de UF -> Região
        const regioes = {
            'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
            'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
            'Centro-Oeste': ['DF', 'GO', 'MS', 'MT'],
            'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
            'Sul': ['PR', 'RS', 'SC'],
        };
        // Tenta extrair UF do local (ex: "São Paulo - SP" ou "SP")
        const ufMatch = valor.match(/\b([A-Z]{2})\b$/);
        if (ufMatch) {
            const uf = ufMatch[1];
            for (const [regiao, ufs] of Object.entries(regioes)) {
                if (ufs.includes(uf))
                    return regiao;
            }
        }
        // Tenta encontrar nome da região diretamente no texto
        for (const regiao of Object.keys(regioes)) {
            if (valor.includes(regiao.toUpperCase()))
                return regiao;
        }
        return null;
    }
    normalize(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
    normalizeKey(value) {
        return this.normalize(value).replace(/[^a-z0-9]/g, '');
    }
    isOrcadoClassificacao(value) {
        const normalized = this.normalizeKey(value);
        return normalized === 'orcado';
    }
    isNaoOrcadoClassificacao(value) {
        const normalized = this.normalizeKey(value);
        return normalized === 'naoorcado' || normalized === 'naoorcada';
    }
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
    matchFilter(values, filters) {
        if (!filters.length) {
            return true;
        }
        const normalizedValues = new Set(values
            .map((value) => this.normalize(value))
            .filter(Boolean));
        return filters.some((filter) => normalizedValues.has(this.normalize(filter)));
    }
    calcularPessoasImpactadas(projetos) {
        let totalImpactoMensal = 0;
        let encontrouImpactoMensal = false;
        for (const projeto of projetos) {
            const impactoMensal = projeto.impactoMensal;
            if (!Array.isArray(impactoMensal)) {
                continue;
            }
            for (const item of impactoMensal) {
                if (!item || typeof item !== 'object') {
                    continue;
                }
                const diretas = Number(item.pessoasDiretas || 0);
                const indiretas = Number(item.pessoasIndiretas || 0);
                if (diretas > 0 || indiretas > 0) {
                    encontrouImpactoMensal = true;
                }
                totalImpactoMensal += diretas + indiretas;
            }
        }
        if (encontrouImpactoMensal) {
            return totalImpactoMensal;
        }
        return projetos.reduce((acc, projeto) => acc + Number(projeto.quantidadePessoasCadastradas || 0), 0);
    }
    monthKey(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }
    formatMonthKey(monthKey) {
        const [year, month] = monthKey.split('-');
        return `${month}/${year}`;
    }
    startOfMonth(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    }
    addMonth(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    }
    monthsBetweenInclusive(start, end) {
        const normalizedStart = this.startOfMonth(start);
        const normalizedEnd = this.startOfMonth(end);
        const begin = normalizedStart <= normalizedEnd ? normalizedStart : normalizedEnd;
        const finish = normalizedStart <= normalizedEnd ? normalizedEnd : normalizedStart;
        const months = [];
        let cursor = begin;
        while (cursor <= finish) {
            months.push(this.monthKey(cursor));
            cursor = this.addMonth(cursor);
        }
        return months;
    }
    buildCurvaMensalProjetos(projetos, projetoFilters) {
        const filtered = projetos.filter((projeto) => this.matchFilter([projeto.nome], projetoFilters));
        const ranked = [...filtered]
            .map((projeto) => ({
            ...projeto,
            total: Number(projeto.valorMonetarioPrevisto || 0) + Number(projeto.valorMonetarioRealizado || 0),
        }))
            .sort((a, b) => b.total - a.total);
        const selected = ranked.slice(0, this.curvaProjetoLimit);
        const monthSet = new Set();
        const seriesRaw = selected.map((projeto) => {
            const currentMonth = this.startOfMonth(new Date());
            const start = projeto.dataInicio ? this.startOfMonth(new Date(projeto.dataInicio)) : currentMonth;
            const end = projeto.dataFim ? this.startOfMonth(new Date(projeto.dataFim)) : start;
            const months = this.monthsBetweenInclusive(start, end);
            const monthCount = Math.max(months.length, 1);
            const previstoTotal = Number(projeto.valorMonetarioPrevisto || 0);
            const realizadoTotal = Number(projeto.valorMonetarioRealizado || 0);
            const previstoMensal = previstoTotal / monthCount;
            const realizadoMensal = realizadoTotal / monthCount;
            const previstoByMonth = new Map();
            const realizadoByMonth = new Map();
            for (const month of months) {
                monthSet.add(month);
                previstoByMonth.set(month, previstoMensal);
                realizadoByMonth.set(month, realizadoMensal);
            }
            return {
                projeto: projeto.nome,
                previstoByMonth,
                realizadoByMonth,
            };
        });
        const monthsSorted = Array.from(monthSet).sort((a, b) => a.localeCompare(b));
        return {
            competencias: monthsSorted.map((month) => this.formatMonthKey(month)),
            series: seriesRaw.map((serie) => ({
                projeto: serie.projeto,
                previsto: monthsSorted.map((month) => Number((serie.previstoByMonth.get(month) || 0).toFixed(2))),
                realizado: monthsSorted.map((month) => Number((serie.realizadoByMonth.get(month) || 0).toFixed(2))),
            })),
            totalProjetos: filtered.length,
            projetosExibidos: selected.length,
            metodologia: 'Valores totais previsto/realizado de cada projeto distribuídos igualmente entre os meses de início e fim do projeto.',
        };
    }
    async getMetricas(req, res) {
        try {
            const programaFilters = this.parseStringListFilter(req.query.programa);
            const classificacaoFilters = this.parseStringListFilter(req.query.classificacao);
            const orcadoNaoOrcadoFilters = this.parseStringListFilter(req.query.orcadoNaoOrcado);
            const projetoFilters = this.parseStringListFilter(req.query.projeto);
            const dataInicioFilter = String(req.query.dataInicio || '').trim();
            const dataFimFilter = String(req.query.dataFim || '').trim();
            const obraIdFilters = this.parseNumberListFilter(req.query.obraId);
            const metricas = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
                const [notasFiscais, alertasAtivos, totalInstituicoes, totalObras, obrasAtivas, obrasInativas, projetosResumo, obrasLista, classificacoesLista, programasLista, projetosAtivosLista, orcadoNaoOrcadoAtivos,] = await Promise.all([
                    database_1.default.notaFiscal.findMany({
                        include: {
                            obra: {
                                select: {
                                    id: true,
                                    nomeObra: true,
                                    codigoObra: true,
                                    local: true,
                                    un: true,
                                    cidade: true,
                                },
                            },
                            classificacoes: {
                                include: {
                                    programa: { select: { id: true, nome: true } },
                                    projeto: { select: { id: true, nome: true } },
                                    classificacao: { select: { id: true, nome: true } },
                                },
                            },
                        },
                    }),
                    database_1.default.alerta.count({ where: { status: 'ATIVO' } }),
                    database_1.default.instituicaoSocial.count(),
                    database_1.default.obra.count(),
                    database_1.default.obra.count({ where: { status: true } }),
                    database_1.default.obra.count({ where: { status: false } }),
                    database_1.default.projeto.findMany({
                        select: {
                            id: true,
                            nome: true,
                            dataInicio: true,
                            dataFim: true,
                            impactoMensal: true,
                            quantidadePessoasCadastradas: true,
                            valorMonetarioPrevisto: true,
                            valorMonetarioRealizado: true,
                        },
                    }),
                    database_1.default.obra.findMany({
                        where: { status: true },
                        select: {
                            id: true,
                            nomeObra: true,
                            codigoObra: true,
                        },
                        orderBy: { nomeObra: 'asc' },
                    }),
                    database_1.default.classificacao.findMany({
                        where: { status: true },
                        select: { nome: true },
                        orderBy: { nome: 'asc' },
                    }),
                    database_1.default.programa.findMany({
                        where: { status: true },
                        select: { nome: true },
                        orderBy: { nome: 'asc' },
                    }),
                    database_1.default.projeto.findMany({
                        where: { status: true },
                        select: { nome: true },
                        orderBy: { nome: 'asc' },
                    }),
                    this.listarOrcadoNaoOrcadoAtivos(),
                ]);
                const dataInicio = dataInicioFilter ? new Date(`${dataInicioFilter}T00:00:00`) : null;
                const dataFim = dataFimFilter ? new Date(`${dataFimFilter}T23:59:59`) : null;
                const notasFiltradas = notasFiscais.filter((nota) => {
                    const metadata = (0, notaFiscalMetadata_1.parseNotaFiscalMetadata)(nota.observacao);
                    const programas = [
                        metadata.camposObrigatorios.programa,
                        ...nota.classificacoes.map((c) => c.programa?.nome),
                    ].filter(Boolean);
                    const classificacoes = [
                        metadata.camposObrigatorios.classificacaoProjetoAtt,
                        ...nota.classificacoes.map((c) => c.classificacao?.nome),
                    ].filter(Boolean);
                    const projetos = [
                        metadata.camposObrigatorios.projeto,
                        ...nota.classificacoes.map((c) => c.projeto?.nome),
                    ].filter(Boolean);
                    const orcadoNaoOrcado = metadata.camposObrigatorios.orcadoNaoOrcado;
                    const matchPrograma = this.matchFilter(programas, programaFilters);
                    const matchClassificacao = this.matchFilter(classificacoes, classificacaoFilters);
                    const matchProjeto = this.matchFilter(projetos, projetoFilters);
                    const matchOrcado = this.matchFilter([orcadoNaoOrcado], orcadoNaoOrcadoFilters);
                    const matchObra = obraIdFilters.length ? obraIdFilters.includes(Number(nota.obraId || 0)) : true;
                    const dataEmissao = new Date(nota.dataEmissao);
                    const matchDataInicio = dataInicio ? dataEmissao >= dataInicio : true;
                    const matchDataFim = dataFim ? dataEmissao <= dataFim : true;
                    return (matchPrograma &&
                        matchClassificacao &&
                        matchProjeto &&
                        matchOrcado &&
                        matchObra &&
                        matchDataInicio &&
                        matchDataFim);
                });
                const programasDisponiveisSet = new Set(programasLista.map((item) => String(item.nome || '').trim()).filter(Boolean));
                const classificacoesDisponiveisSet = new Set(classificacoesLista.map((item) => String(item.nome || '').trim()).filter(Boolean));
                const orcadoDisponiveisSet = new Set(orcadoNaoOrcadoAtivos.map((item) => String(item || '').trim()).filter(Boolean));
                const projetosDisponiveisSet = new Set(projetosAtivosLista.map((item) => String(item.nome || '').trim()).filter(Boolean));
                for (const nf of notasFiscais) {
                    const metadata = (0, notaFiscalMetadata_1.parseNotaFiscalMetadata)(nf.observacao);
                    const programasNF = [
                        metadata.camposObrigatorios.programa,
                        ...nf.classificacoes.map((c) => c.programa?.nome),
                    ]
                        .map((item) => String(item || '').trim())
                        .filter(Boolean);
                    const classificacoesNF = [
                        metadata.camposObrigatorios.classificacaoProjetoAtt,
                        ...nf.classificacoes.map((c) => c.classificacao?.nome),
                    ]
                        .map((item) => String(item || '').trim())
                        .filter(Boolean);
                    const projetosNF = [
                        metadata.camposObrigatorios.projeto,
                        ...nf.classificacoes.map((c) => c.projeto?.nome),
                    ]
                        .map((item) => String(item || '').trim())
                        .filter(Boolean);
                    const orcadoNF = String(metadata.camposObrigatorios.orcadoNaoOrcado || '').trim();
                    for (const item of programasNF) {
                        programasDisponiveisSet.add(item);
                    }
                    for (const item of classificacoesNF) {
                        classificacoesDisponiveisSet.add(item);
                    }
                    for (const item of projetosNF) {
                        projetosDisponiveisSet.add(item);
                    }
                    if (orcadoNF) {
                        orcadoDisponiveisSet.add(orcadoNF);
                    }
                }
                const totalNF = notasFiltradas.length;
                const nfPendentes = notasFiltradas.filter((nf) => nf.status === 'PENDENTE').length;
                const nfClassificadas = notasFiltradas.filter((nf) => nf.status === 'CLASSIFICADA').length;
                const totalValor = notasFiltradas.reduce((acc, nf) => acc + Number(nf.valor || 0), 0);
                let totalValorOrcado = 0;
                let totalValorNaoOrcado = 0;
                const nfComPendenciaClassificacao = notasFiltradas.filter((item) => (0, notaFiscalMetadata_1.hasPendenciaClassificacao)((0, notaFiscalMetadata_1.parseNotaFiscalMetadata)(item.observacao))).length;
                const totalPessoasImpactadas = this.calcularPessoasImpactadas(projetosResumo);
                const nfPorObraMap = new Map();
                const nfPorProgramaMap = new Map();
                const valorPorProgramaMap = new Map();
                const nfPorClassificacaoMap = new Map();
                const valorPorClassificacaoMap = new Map();
                const nfPorOrcadoMap = new Map();
                const nfPorLocalizacaoMap = new Map();
                const nfPorRegiaoMap = new Map();
                const valorPorOrcadoMap = new Map();
                const valorPorLocalizacaoMap = new Map();
                const nfPorEstadoMap = new Map();
                const valorPorEstadoMap = new Map();
                for (const nf of notasFiltradas) {
                    const metadata = (0, notaFiscalMetadata_1.parseNotaFiscalMetadata)(nf.observacao);
                    const obraNome = nf.obra?.nomeObra || 'Sem obra';
                    const obraKey = `${nf.obraId || 0}:${obraNome}`;
                    const localizacao = String(nf.obra?.local || nf.obra?.nomeObra || 'Sem localização').trim() || 'Sem localização';
                    const obraAtual = nfPorObraMap.get(obraKey) || { name: obraNome, value: 0, valor: 0 };
                    obraAtual.value += 1;
                    obraAtual.valor += Number(nf.valor || 0);
                    nfPorObraMap.set(obraKey, obraAtual);
                    const programa = metadata.camposObrigatorios.programa ||
                        nf.classificacoes.find((c) => c.programa?.nome)?.programa?.nome ||
                        'Sem programa';
                    nfPorProgramaMap.set(programa, (nfPorProgramaMap.get(programa) || 0) + 1);
                    valorPorProgramaMap.set(programa, (valorPorProgramaMap.get(programa) || 0) + Number(nf.valor || 0));
                    const classificacao = metadata.camposObrigatorios.classificacaoProjetoAtt ||
                        nf.classificacoes.find((c) => c.classificacao?.nome)?.classificacao?.nome ||
                        'Sem classificação';
                    nfPorClassificacaoMap.set(classificacao, (nfPorClassificacaoMap.get(classificacao) || 0) + 1);
                    valorPorClassificacaoMap.set(classificacao, (valorPorClassificacaoMap.get(classificacao) || 0) + Number(nf.valor || 0));
                    const orcado = metadata.camposObrigatorios.orcadoNaoOrcado || 'Não informado';
                    nfPorOrcadoMap.set(orcado, (nfPorOrcadoMap.get(orcado) || 0) + 1);
                    const valorNF = Number(nf.valor || 0);
                    valorPorOrcadoMap.set(orcado, (valorPorOrcadoMap.get(orcado) || 0) + valorNF);
                    if (this.isOrcadoClassificacao(orcado)) {
                        totalValorOrcado += valorNF;
                    }
                    else if (this.isNaoOrcadoClassificacao(orcado)) {
                        totalValorNaoOrcado += valorNF;
                    }
                    nfPorLocalizacaoMap.set(localizacao, (nfPorLocalizacaoMap.get(localizacao) || 0) + 1);
                    valorPorLocalizacaoMap.set(localizacao, (valorPorLocalizacaoMap.get(localizacao) || 0) + valorNF);
                    const regiao = this.getRegiao(nf.obra?.local)
                        ?? this.getRegiao(nf.obra?.cidade)
                        ?? this.getRegiao(nf.obra?.un)
                        ?? 'Não classificado';
                    nfPorRegiaoMap.set(regiao, (nfPorRegiaoMap.get(regiao) || 0) + 1);
                    const estadoMatch = String(nf.obra?.local || nf.obra?.cidade || nf.obra?.un || '').trim().toUpperCase().match(/\b([A-Z]{2})\b$/);
                    const estado = estadoMatch ? estadoMatch[1] : 'N/D';
                    nfPorEstadoMap.set(estado, (nfPorEstadoMap.get(estado) || 0) + 1);
                    valorPorEstadoMap.set(estado, (valorPorEstadoMap.get(estado) || 0) + valorNF);
                }
                const projetosCurva = projetosResumo
                    .filter((projeto) => this.matchFilter([projeto.nome], projetoFilters))
                    .map((projeto) => ({
                    projeto: projeto.nome,
                    previsto: Number(projeto.valorMonetarioPrevisto || 0),
                    realizado: Number(projeto.valorMonetarioRealizado || 0),
                }));
                const curvaPrevistoRealizadoMensalProjetos = this.buildCurvaMensalProjetos(projetosResumo, projetoFilters);
                const valorPrevistoProjetos = projetosCurva.reduce((acc, item) => acc + item.previsto, 0);
                const valorRealizadoProjetos = projetosCurva.reduce((acc, item) => acc + item.realizado, 0);
                const filtrosDisponiveis = {
                    programas: Array.from(programasDisponiveisSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
                    classificacoes: Array.from(classificacoesDisponiveisSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
                    orcadoNaoOrcado: Array.from(orcadoDisponiveisSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
                    obras: obrasLista.map((obra) => ({ id: obra.id, nome: `${obra.codigoObra} - ${obra.nomeObra}` })),
                    projetos: Array.from(projetosDisponiveisSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
                };
                return {
                    mensagem: 'Métricas do dashboard obtidas com sucesso',
                    payload: {
                        totalNF,
                        nfPendentes,
                        nfClassificadas,
                        nfComPendenciaClassificacao,
                        totalValor,
                        totalValorOrcado: Number(totalValorOrcado.toFixed(2)),
                        totalValorNaoOrcado: Number(totalValorNaoOrcado.toFixed(2)),
                        nfPorObra: Array.from(nfPorObraMap.values()).sort((a, b) => b.value - a.value),
                        nfPorProjeto: [],
                        alertasAtivos,
                        totalInstituicoes,
                        totalObras,
                        obrasAtivas,
                        obrasInativas,
                        distribuicaoPorRegiao: Array.from(nfPorRegiaoMap.entries())
                            .map(([name, value]) => ({ name, value }))
                            .sort((a, b) => b.value - a.value),
                        distribuicaoPorEstado: Array.from(nfPorEstadoMap.entries())
                            .map(([name, value]) => ({ name, value }))
                            .sort((a, b) => b.value - a.value),
                        valoresPorEstado: Array.from(valorPorEstadoMap.entries())
                            .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
                            .sort((a, b) => b.value - a.value),
                        totalProjetos: projetosResumo.length,
                        valorPrevistoProjetos,
                        valorRealizadoProjetos,
                        totalPessoasImpactadas,
                        distribuicaoPorPrograma: Array.from(nfPorProgramaMap.entries()).map(([name, value]) => ({ name, value })),
                        distribuicaoPorClassificacao: Array.from(nfPorClassificacaoMap.entries()).map(([name, value]) => ({ name, value })),
                        distribuicaoPorOrcado: Array.from(nfPorOrcadoMap.entries()).map(([name, value]) => ({ name, value })),
                        distribuicaoPorLocalizacao: Array.from(nfPorLocalizacaoMap.entries())
                            .map(([name, value]) => ({ name, value }))
                            .sort((a, b) => b.value - a.value),
                        valoresPorOrcado: Array.from(valorPorOrcadoMap.entries())
                            .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
                            .sort((a, b) => b.value - a.value),
                        valoresPorLocalizacao: Array.from(valorPorLocalizacaoMap.entries())
                            .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
                            .sort((a, b) => b.value - a.value),
                        curvaPrevistoRealizadoProjetos: projetosCurva,
                        curvaPrevistoRealizadoMensalProjetos,
                        valoresPorPrograma: Array.from(valorPorProgramaMap.entries())
                            .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
                            .sort((a, b) => b.value - a.value),
                        valoresPorClassificacao: Array.from(valorPorClassificacaoMap.entries())
                            .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
                            .sort((a, b) => b.value - a.value),
                        valoresPorObra: Array.from(nfPorObraMap.values())
                            .map((item) => ({ name: item.name, value: Number(item.valor.toFixed(2)) }))
                            .sort((a, b) => b.value - a.value),
                        filtrosAplicados: {
                            programa: programaFilters,
                            classificacao: classificacaoFilters,
                            orcadoNaoOrcado: orcadoNaoOrcadoFilters,
                            obraId: obraIdFilters,
                            projeto: projetoFilters,
                            dataInicio: dataInicioFilter,
                            dataFim: dataFimFilter,
                        },
                        filtrosDisponiveis,
                    },
                };
            }, async () => {
                const fallback = await notaFiscalRepository.findAll(1, 5000);
                const totalNF = fallback.total;
                const nfPendentes = fallback.notasFiscais.filter((nf) => nf.status === 'PENDENTE').length;
                const nfClassificadas = fallback.notasFiscais.filter((nf) => nf.status === 'CLASSIFICADA').length;
                const totalValor = fallback.notasFiscais.reduce((acc, nf) => acc + Number(nf.valor || 0), 0);
                let totalValorOrcado = 0;
                let totalValorNaoOrcado = 0;
                const nfPorLocalizacaoMap = new Map();
                const valorPorOrcadoMap = new Map();
                const valorPorLocalizacaoMap = new Map();
                const nfComPendenciaClassificacao = fallback.notasFiscais.filter((nf) => {
                    if (typeof nf.pendenteClassificacao === 'boolean') {
                        return nf.pendenteClassificacao;
                    }
                    return (0, notaFiscalMetadata_1.hasPendenciaClassificacao)((0, notaFiscalMetadata_1.parseNotaFiscalMetadata)(nf.observacao || null));
                }).length;
                for (const nf of fallback.notasFiscais) {
                    const metadata = (0, notaFiscalMetadata_1.parseNotaFiscalMetadata)(nf.observacao || null);
                    const orcado = String(metadata.camposObrigatorios.orcadoNaoOrcado || '').trim();
                    const valorNF = Number(nf.valor || 0);
                    valorPorOrcadoMap.set(orcado || 'Não informado', (valorPorOrcadoMap.get(orcado || 'Não informado') || 0) + valorNF);
                    if (this.isOrcadoClassificacao(orcado)) {
                        totalValorOrcado += valorNF;
                    }
                    else if (this.isNaoOrcadoClassificacao(orcado)) {
                        totalValorNaoOrcado += valorNF;
                    }
                    const localizacao = String(nf?.obra?.local || 'Sem localização').trim() || 'Sem localização';
                    nfPorLocalizacaoMap.set(localizacao, (nfPorLocalizacaoMap.get(localizacao) || 0) + 1);
                    valorPorLocalizacaoMap.set(localizacao, (valorPorLocalizacaoMap.get(localizacao) || 0) + valorNF);
                }
                return {
                    mensagem: 'Métricas do dashboard obtidas com sucesso (modo local)',
                    payload: {
                        totalNF,
                        nfPendentes,
                        nfClassificadas,
                        nfComPendenciaClassificacao,
                        totalValor,
                        totalValorOrcado: Number(totalValorOrcado.toFixed(2)),
                        totalValorNaoOrcado: Number(totalValorNaoOrcado.toFixed(2)),
                        nfPorObra: [],
                        nfPorProjeto: [],
                        alertasAtivos: 0,
                        totalInstituicoes: 0,
                        totalObras: 0,
                        obrasAtivas: 0,
                        obrasInativas: 0,
                        valorPrevistoProjetos: 0,
                        valorRealizadoProjetos: 0,
                        totalProjetos: 0,
                        totalPessoasImpactadas: 0,
                        distribuicaoPorPrograma: [],
                        distribuicaoPorClassificacao: [],
                        distribuicaoPorOrcado: [],
                        distribuicaoPorRegiao: [],
                        distribuicaoPorEstado: [],
                        valoresPorEstado: [],
                        distribuicaoPorLocalizacao: Array.from(nfPorLocalizacaoMap.entries())
                            .map(([name, value]) => ({ name, value }))
                            .sort((a, b) => b.value - a.value),
                        valoresPorOrcado: Array.from(valorPorOrcadoMap.entries())
                            .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
                            .sort((a, b) => b.value - a.value),
                        valoresPorLocalizacao: Array.from(valorPorLocalizacaoMap.entries())
                            .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
                            .sort((a, b) => b.value - a.value),
                        curvaPrevistoRealizadoProjetos: [],
                        curvaPrevistoRealizadoMensalProjetos: {
                            competencias: [],
                            series: [],
                            totalProjetos: 0,
                            projetosExibidos: 0,
                            metodologia: '',
                        },
                        valoresPorPrograma: [],
                        valoresPorClassificacao: [],
                        valoresPorObra: [],
                        filtrosAplicados: {
                            programa: programaFilters,
                            classificacao: classificacaoFilters,
                            orcadoNaoOrcado: orcadoNaoOrcadoFilters,
                            obraId: obraIdFilters,
                            projeto: projetoFilters,
                            dataInicio: dataInicioFilter,
                            dataFim: dataFimFilter,
                        },
                        filtrosDisponiveis: {
                            programas: [],
                            classificacoes: [],
                            orcadoNaoOrcado: [],
                            obras: [],
                            projetos: [],
                        },
                    },
                };
            });
            res.status(200).json((0, response_1.successResponse)(metricas.mensagem, metricas.payload));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async getAlertas(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const skip = (page - 1) * pageSize;
            const alertasResponse = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => {
                const [alertas, total] = await Promise.all([
                    database_1.default.alerta.findMany({
                        where: { status: 'ATIVO' },
                        skip,
                        take: pageSize,
                        orderBy: { dataCriacao: 'desc' },
                        include: {
                            notaFiscal: true,
                            responsavel: true,
                        },
                    }),
                    database_1.default.alerta.count({ where: { status: 'ATIVO' } }),
                ]);
                return {
                    mensagem: 'Alertas obtidos com sucesso',
                    payload: {
                        alertas,
                        pagination: {
                            page,
                            pageSize,
                            total,
                            totalPages: Math.ceil(total / pageSize),
                        },
                    },
                };
            }, async () => ({
                mensagem: 'Alertas obtidos com sucesso (modo local)',
                payload: {
                    alertas: [],
                    pagination: {
                        page,
                        pageSize,
                        total: 0,
                        totalPages: 0,
                    },
                },
            }));
            res.status(200).json((0, response_1.successResponse)(alertasResponse.mensagem, alertasResponse.payload));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=DashboardController.js.map