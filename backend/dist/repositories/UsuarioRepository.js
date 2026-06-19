"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../utils/auth");
class UsuarioRepository {
    async create(data) {
        const senhaHash = await (0, auth_1.hashPassword)(data.senha);
        const usuario = await database_1.default.usuario.create({
            data: {
                nome: data.nome,
                email: data.email,
                dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
                senha: senhaHash,
                perfil: data.perfil ?? 'ANALYST',
                status: data.status ?? true,
            },
        });
        return this.formatResponse(usuario);
    }
    async findById(id) {
        const usuario = await database_1.default.usuario.findUnique({
            where: { id },
        });
        return usuario ? this.formatResponse(usuario) : null;
    }
    async findByEmail(email) {
        return database_1.default.usuario.findUnique({
            where: { email },
        });
    }
    async findAll(page = 1, pageSize = 10) {
        const skip = (page - 1) * pageSize;
        const [usuarios, total] = await Promise.all([
            database_1.default.usuario.findMany({
                skip,
                take: pageSize,
                orderBy: { dataCriacao: 'desc' },
            }),
            database_1.default.usuario.count(),
        ]);
        return {
            usuarios: usuarios.map((u) => this.formatResponse(u)),
            total,
        };
    }
    async update(id, data) {
        const updateData = {
            ...data,
            dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
        };
        const usuario = await database_1.default.usuario.update({
            where: { id },
            data: updateData,
        });
        return this.formatResponse(usuario);
    }
    async updateResetCode(email, codigo, expiraEm) {
        await database_1.default.usuario.update({
            where: { email },
            data: {
                codigoResetSenha: codigo,
                expiraResetSenha: expiraEm,
            },
        });
    }
    async updatePasswordByEmail(email, novaSenha) {
        const senhaHash = await (0, auth_1.hashPassword)(novaSenha);
        await database_1.default.usuario.update({
            where: { email },
            data: {
                senha: senhaHash,
                codigoResetSenha: null,
                expiraResetSenha: null,
            },
        });
    }
    async updatePasswordById(id, novaSenha) {
        const senhaHash = await (0, auth_1.hashPassword)(novaSenha);
        await database_1.default.usuario.update({
            where: { id },
            data: {
                senha: senhaHash,
                codigoResetSenha: null,
                expiraResetSenha: null,
            },
        });
    }
    async delete(id) {
        await database_1.default.usuario.delete({
            where: { id },
        });
    }
    formatResponse(usuario) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { senha, ...rest } = usuario;
        return rest;
    }
}
exports.UsuarioRepository = UsuarioRepository;
//# sourceMappingURL=UsuarioRepository.js.map