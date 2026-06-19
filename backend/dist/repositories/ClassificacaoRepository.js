"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassificacaoRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class ClassificacaoRepository {
    async create(data) {
        const codigoGerado = data.codigo || `CLS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const classificacao = await database_1.default.classificacao.create({
            data: {
                codigo: codigoGerado,
                nome: data.nome,
                categoria: data.categoria,
                status: data.status ?? true,
            },
        });
        return classificacao;
    }
    async findById(id) {
        const classificacao = await database_1.default.classificacao.findUnique({
            where: { id },
        });
        return classificacao;
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
                        { categoria: { contains: searchTerm, mode: 'insensitive' } },
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
        const [classificacoes, total] = await Promise.all([
            database_1.default.classificacao.findMany({
                where,
                skip,
                take: pageSize,
                orderBy,
            }),
            database_1.default.classificacao.count({ where }),
        ]);
        return {
            classificacoes: classificacoes,
            total,
        };
    }
    async update(id, data) {
        const classificacao = await database_1.default.classificacao.update({
            where: { id },
            data,
        });
        return classificacao;
    }
    async delete(id) {
        await database_1.default.classificacao.delete({
            where: { id },
        });
    }
}
exports.ClassificacaoRepository = ClassificacaoRepository;
//# sourceMappingURL=ClassificacaoRepository.js.map