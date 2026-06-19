"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjetoRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
const library_1 = require("@prisma/client/runtime/library");
class ProjetoRepository {
    /**
     * Calcula a soma de todas as Notas Fiscais classificadas para um projeto
     */
    async calcularValorRealizado(projetoId) {
        const nfsSomadas = await database_1.default.classificacaoNF.findMany({
            where: {
                projetoId,
                notaFiscal: {
                    status: 'CLASSIFICADA',
                },
            },
            select: {
                notaFiscal: {
                    select: {
                        valor: true,
                    },
                },
            },
        });
        const total = nfsSomadas.reduce((acc, item) => {
            return acc + (item.notaFiscal ? Number(item.notaFiscal.valor) : 0);
        }, 0);
        return total;
    }
    async mapResponse(projeto) {
        // Calcula o valor realizado a partir das NFs classificadas
        const valorRealizado = await this.calcularValorRealizado(projeto.id);
        return {
            ...projeto,
            dataInicio: projeto.dataInicio ?? null,
            dataFim: projeto.dataFim ?? null,
            impactoMensal: Array.isArray(projeto.impactoMensal) ? projeto.impactoMensal : [],
            participantesProjeto: Array.isArray(projeto.participantesProjeto) ? projeto.participantesProjeto : [],
            valorMonetarioPrevisto: Number(projeto.valorMonetarioPrevisto ?? 0),
            valorMonetarioRealizado: valorRealizado,
            quantidadePessoasCadastradas: Number(projeto.quantidadePessoasCadastradas ?? 0),
            publicoAlvo: projeto.publicoAlvo ?? null,
            instituicaoId: projeto.instituicaoId ?? null,
            instituicaoNome: projeto.instituicao?.instituicao ?? null,
        };
    }
    async create(data) {
        const codigoGerado = data.codigo?.trim() || `PRJ-${Date.now()}`;
        const projeto = await database_1.default.projeto.create({
            data: {
                codigo: codigoGerado,
                nome: data.nome,
                descricao: data.descricao,
                dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
                dataFim: data.dataFim ? new Date(data.dataFim) : null,
                impactoMensal: (data.impactoMensal ?? []),
                participantesProjeto: (data.participantesProjeto ?? []),
                pessoasCadastradas: data.pessoasCadastradas || null,
                quantidadePessoasCadastradas: data.quantidadePessoasCadastradas ?? 0,
                valorMonetarioPrevisto: new library_1.Decimal(data.valorMonetarioPrevisto ?? 0),
                valorMonetarioRealizado: new library_1.Decimal(0), // Sempre começa em 0, será calculado
                publicoAlvo: data.publicoAlvo || null,
                instituicaoId: data.instituicaoId ?? null,
                imagem: data.imagem || null,
                status: data.status ?? true,
            },
            include: {
                instituicao: {
                    select: {
                        instituicao: true,
                    },
                },
            },
        });
        return await this.mapResponse(projeto);
    }
    async findById(id) {
        const projeto = await database_1.default.projeto.findUnique({
            where: { id },
            include: {
                instituicao: {
                    select: {
                        instituicao: true,
                    },
                },
            },
        });
        return projeto ? await this.mapResponse(projeto) : null;
    }
    async findAll(page = 1, pageSize = 10, search = '', status = 'all', sortBy = 'dataCriacao', sortOrder = 'desc') {
        const skip = (page - 1) * pageSize;
        const searchTerm = search.trim();
        const where = {
            ...(status === 'active' ? { status: true } : {}),
            ...(status === 'inactive' ? { status: false } : {}),
            ...(searchTerm
                ? {
                    OR: [
                        { nome: { contains: searchTerm, mode: 'insensitive' } },
                        { codigo: { contains: searchTerm, mode: 'insensitive' } },
                        { descricao: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const sortFieldMap = {
            id: 'id',
            nome: 'nome',
            codigo: 'codigo',
            dataCriacao: 'dataCriacao',
        };
        const orderBy = { [sortFieldMap[sortBy]]: sortOrder };
        const [projetos, total] = await Promise.all([
            database_1.default.projeto.findMany({
                where,
                skip,
                take: pageSize,
                orderBy,
                include: {
                    instituicao: {
                        select: {
                            instituicao: true,
                        },
                    },
                },
            }),
            database_1.default.projeto.count({ where }),
        ]);
        const projetosComValores = await Promise.all(projetos.map((projeto) => this.mapResponse(projeto)));
        return {
            projetos: projetosComValores,
            total,
        };
    }
    async update(id, data) {
        const updateData = { ...data };
        // Remove valorMonetarioRealizado do update pois é calculado automaticamente
        delete updateData.valorMonetarioRealizado;
        if (data.valorMonetarioPrevisto !== undefined) {
            updateData.valorMonetarioPrevisto = new library_1.Decimal(data.valorMonetarioPrevisto ?? 0);
        }
        if (data.dataInicio !== undefined) {
            updateData.dataInicio = data.dataInicio ? new Date(data.dataInicio) : null;
        }
        if (data.dataFim !== undefined) {
            updateData.dataFim = data.dataFim ? new Date(data.dataFim) : null;
        }
        if (data.impactoMensal !== undefined) {
            updateData.impactoMensal = data.impactoMensal;
        }
        if (data.participantesProjeto !== undefined) {
            updateData.participantesProjeto = data.participantesProjeto;
        }
        if (data.imagem !== undefined) {
            updateData.imagem = data.imagem || null;
        }
        if (data.publicoAlvo !== undefined) {
            updateData.publicoAlvo = data.publicoAlvo || null;
        }
        if (data.instituicaoId !== undefined) {
            updateData.instituicaoId = data.instituicaoId ?? null;
        }
        const projeto = await database_1.default.projeto.update({
            where: { id },
            data: updateData,
            include: {
                instituicao: {
                    select: {
                        instituicao: true,
                    },
                },
            },
        });
        return await this.mapResponse(projeto);
    }
    async delete(id) {
        await database_1.default.projeto.delete({
            where: { id },
        });
    }
}
exports.ProjetoRepository = ProjetoRepository;
//# sourceMappingURL=ProjetoRepository.js.map