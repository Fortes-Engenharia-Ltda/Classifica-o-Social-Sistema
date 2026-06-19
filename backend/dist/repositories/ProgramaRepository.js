"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramaRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class ProgramaRepository {
    async create(data) {
        const codigoGerado = data.codigo || `PRG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const programa = await database_1.default.programa.create({
            data: {
                codigo: codigoGerado,
                nome: data.nome,
                descricao: data.descricao,
                status: data.status ?? true,
            },
        });
        return programa;
    }
    async findById(id) {
        const programa = await database_1.default.programa.findUnique({
            where: { id },
        });
        return programa;
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
        const [programas, total] = await Promise.all([
            database_1.default.programa.findMany({
                where,
                skip,
                take: pageSize,
                orderBy,
            }),
            database_1.default.programa.count({ where }),
        ]);
        return {
            programas: programas,
            total,
        };
    }
    async update(id, data) {
        const programa = await database_1.default.programa.update({
            where: { id },
            data,
        });
        return programa;
    }
    async delete(id) {
        await database_1.default.programa.delete({
            where: { id },
        });
    }
}
exports.ProgramaRepository = ProgramaRepository;
//# sourceMappingURL=ProgramaRepository.js.map