"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObraRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class ObraRepository {
    async create(data) {
        const obra = await database_1.default.obra.create({
            data: {
                codigoObra: data.codigoObra,
                nomeObra: data.nomeObra,
                cidade: data.cidade,
                centroCusto: data.centroCusto,
                status: data.status ?? true,
                idCentroCusto: data.idCentroCusto,
                idUN: data.idUN,
                un: data.un,
                descricao: data.descricao,
                projeto: data.projeto,
                local: data.local,
                cliente: data.cliente,
                gerente: data.gerente,
                gestor: data.gestor,
            },
        });
        return obra;
    }
    async findById(id) {
        const obra = await database_1.default.obra.findUnique({
            where: { id },
        });
        return obra;
    }
    async findByCodigo(codigo) {
        const obra = await database_1.default.obra.findUnique({
            where: { codigoObra: codigo },
        });
        return obra;
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
                        { codigoObra: { contains: searchTerm, mode: 'insensitive' } },
                        { nomeObra: { contains: searchTerm, mode: 'insensitive' } },
                        { projeto: { contains: searchTerm, mode: 'insensitive' } },
                        { idCentroCusto: { contains: searchTerm, mode: 'insensitive' } },
                        { centroCusto: { contains: searchTerm, mode: 'insensitive' } },
                        { idUN: { contains: searchTerm, mode: 'insensitive' } },
                        { un: { contains: searchTerm, mode: 'insensitive' } },
                        { local: { contains: searchTerm, mode: 'insensitive' } },
                        { cliente: { contains: searchTerm, mode: 'insensitive' } },
                        { gerente: { contains: searchTerm, mode: 'insensitive' } },
                        { gestor: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const sortFieldMap = {
            id: 'id',
            codigoObra: 'codigoObra',
            nomeObra: 'nomeObra',
            status: 'status',
            projeto: 'projeto',
            idCentroCusto: 'idCentroCusto',
            centroCusto: 'centroCusto',
            idUN: 'idUN',
            un: 'un',
            local: 'local',
            cliente: 'cliente',
            gerente: 'gerente',
            gestor: 'gestor',
            dataCriacao: 'dataCriacao',
        };
        const orderBy = { [sortFieldMap[sortBy]]: sortOrder };
        const [obras, total] = await Promise.all([
            database_1.default.obra.findMany({
                where,
                skip,
                take: pageSize,
                orderBy,
            }),
            database_1.default.obra.count({ where }),
        ]);
        return {
            obras: obras,
            total,
        };
    }
    async update(id, data) {
        const obra = await database_1.default.obra.update({
            where: { id },
            data,
        });
        return obra;
    }
    async upsertByCodigo(data) {
        const obra = await database_1.default.obra.upsert({
            where: { codigoObra: data.codigoObra },
            create: {
                codigoObra: data.codigoObra,
                nomeObra: data.nomeObra,
                cidade: data.cidade,
                centroCusto: data.centroCusto,
                status: data.status ?? true,
                idCentroCusto: data.idCentroCusto,
                idUN: data.idUN,
                un: data.un,
                descricao: data.descricao,
                projeto: data.projeto,
                local: data.local,
                cliente: data.cliente,
                gerente: data.gerente,
                gestor: data.gestor,
            },
            update: {
                nomeObra: data.nomeObra,
                cidade: data.cidade,
                centroCusto: data.centroCusto,
                status: data.status ?? true,
                idCentroCusto: data.idCentroCusto,
                idUN: data.idUN,
                un: data.un,
                descricao: data.descricao,
                projeto: data.projeto,
                local: data.local,
                cliente: data.cliente,
                gerente: data.gerente,
                gestor: data.gestor,
            },
        });
        return obra;
    }
    async delete(id) {
        await database_1.default.obra.delete({
            where: { id },
        });
    }
}
exports.ObraRepository = ObraRepository;
//# sourceMappingURL=ObraRepository.js.map