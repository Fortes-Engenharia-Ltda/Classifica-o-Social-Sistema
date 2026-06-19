"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioController = void 0;
const UsuarioService_1 = require("../services/UsuarioService");
const response_1 = require("../utils/response");
const usuarioService = new UsuarioService_1.UsuarioService();
class UsuarioController {
    async create(req, res) {
        try {
            const usuario = await usuarioService.create(req.body);
            res.status(201).json((0, response_1.successResponse)('Usuário criado com sucesso', usuario));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async login(req, res) {
        try {
            const result = await usuarioService.login(req.body);
            res.status(200).json((0, response_1.successResponse)('Login realizado com sucesso', result));
        }
        catch (error) {
            res.status(401).json((0, response_1.errorResponse)(error.message));
        }
    }
    async forgotPassword(req, res) {
        try {
            await usuarioService.forgotPassword(req.body);
            res
                .status(200)
                .json((0, response_1.successResponse)('Se o email estiver cadastrado, enviaremos um código de redefinição'));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async resetPassword(req, res) {
        try {
            await usuarioService.resetPassword(req.body);
            res.status(200).json((0, response_1.successResponse)('Senha redefinida com sucesso'));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findById(req, res) {
        try {
            const usuario = await usuarioService.findById(parseInt(req.params.id));
            if (!usuario) {
                res.status(404).json((0, response_1.errorResponse)('Usuário não encontrado'));
                return;
            }
            res.status(200).json((0, response_1.successResponse)('Usuário encontrado', usuario));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async findAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const result = await usuarioService.findAll(page, pageSize);
            res.status(200).json((0, response_1.successResponse)('Usuários listados com sucesso', {
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
            const usuario = await usuarioService.update(parseInt(req.params.id), req.body);
            res.status(200).json((0, response_1.successResponse)('Usuário atualizado com sucesso', usuario));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async updatePassword(req, res) {
        try {
            await usuarioService.updatePasswordById(parseInt(req.params.id), String(req.body?.senha || ''));
            res.status(200).json((0, response_1.successResponse)('Senha alterada com sucesso'));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async updateMe(req, res) {
        try {
            if (!req.user) {
                res.status(401).json((0, response_1.errorResponse)('Usuário não autenticado'));
                return;
            }
            const usuario = await usuarioService.updateOwnProfile(req.user.id, req.user.perfil, {
                nome: req.body?.nome,
                email: req.body?.email,
            });
            res.status(200).json((0, response_1.successResponse)('Perfil atualizado com sucesso', usuario));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async updateMyPassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json((0, response_1.errorResponse)('Usuário não autenticado'));
                return;
            }
            await usuarioService.updateOwnPassword(req.user.id, String(req.body?.senha || ''));
            res.status(200).json((0, response_1.successResponse)('Senha alterada com sucesso'));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message));
        }
    }
    async delete(req, res) {
        try {
            await usuarioService.delete(parseInt(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    async profile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json((0, response_1.errorResponse)('Usuário não autenticado'));
                return;
            }
            const usuario = await usuarioService.findById(req.user.id);
            res.status(200).json((0, response_1.successResponse)('Perfil obtido com sucesso', usuario));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
}
exports.UsuarioController = UsuarioController;
//# sourceMappingURL=UsuarioController.js.map