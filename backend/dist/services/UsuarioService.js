"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioService = void 0;
const UsuarioRepository_1 = require("../repositories/UsuarioRepository");
const auth_1 = require("../utils/auth");
const validators_1 = require("../utils/validators");
const prismaCircuitBreaker_1 = require("../utils/prismaCircuitBreaker");
const EmailService_1 = require("./EmailService");
const auth_2 = require("../utils/auth");
const logger_1 = __importDefault(require("../config/logger"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const demoUsers = {
    'master@classificacao.com': {
        nome: 'Master',
        email: 'master@classificacao.com',
        senha: 'master123',
        perfil: 'MASTER',
    },
    'admin@classificacao.com': {
        nome: 'Administrador',
        email: 'admin@classificacao.com',
        senha: 'admin123',
        perfil: 'ADMIN',
    },
    'analista@classificacao.com': {
        nome: 'Analista',
        email: 'analista@classificacao.com',
        senha: 'analista123',
        perfil: 'ANALYST',
    },
    'gestor@classificacao.com': {
        nome: 'Gestor',
        email: 'gestor@classificacao.com',
        senha: 'gestor123',
        perfil: 'MANAGER',
    },
};
class UsuarioService {
    constructor() {
        this.usuarioRepository = new UsuarioRepository_1.UsuarioRepository();
        this.emailService = new EmailService_1.EmailService();
        this.fallbackFilePath = path_1.default.resolve(process.cwd(), 'data', 'usuarios-fallback.json');
    }
    async create(data) {
        // Validar email
        if (!(0, validators_1.isValidEmail)(data.email)) {
            throw new Error('Email inválido');
        }
        // Verificar se email já existe
        const existe = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findByEmail(data.email), async () => this.findByEmailLocal(data.email));
        if (existe) {
            throw new Error('Email já cadastrado');
        }
        if (!data.dataNascimento) {
            throw new Error('Data de nascimento é obrigatória');
        }
        const usuarioCriado = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.create(data), async () => this.createLocal(data));
        // Enviar email de boas-vindas (não bloqueia em caso de falha de SMTP)
        this.emailService
            .enviarBoasVindasUsuario(data.email, data.nome, data.senha)
            .catch((err) => logger_1.default.warn(`Falha ao enviar email de boas-vindas para ${data.email}: ${err?.message}`));
        return usuarioCriado;
    }
    async login(data) {
        const usuarioComSenha = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findByEmail(data.email), async () => this.findByEmailLocal(data.email));
        if (usuarioComSenha) {
            const senhaValida = await (0, auth_1.verifyPassword)(data.senha, usuarioComSenha.senha);
            if (!senhaValida) {
                throw new Error('Email ou senha inválidos');
            }
            const token = (0, auth_1.generateToken)({
                id: usuarioComSenha.id,
                email: usuarioComSenha.email,
                nome: usuarioComSenha.nome,
                perfil: usuarioComSenha.perfil,
            });
            const usuarioResponse = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository['formatResponse'](usuarioComSenha), async () => this.localToResponse(usuarioComSenha));
            return {
                accessToken: token,
                usuario: usuarioResponse,
            };
        }
        const demoUser = demoUsers[data.email.toLowerCase()];
        if (!demoUser || demoUser.senha !== data.senha) {
            throw new Error('Email ou senha inválidos');
        }
        const demoUserIdMap = {
            'master@classificacao.com': 100,
            'admin@classificacao.com': 101,
            'analista@classificacao.com': 102,
            'gestor@classificacao.com': 103,
        };
        const demoId = demoUserIdMap[demoUser.email] ?? 999;
        const existingDemoLocalUser = await this.findByIdLocalRaw(demoId);
        if (existingDemoLocalUser &&
            String(existingDemoLocalUser.email).toLowerCase() !== demoUser.email.toLowerCase()) {
            throw new Error('Email ou senha inválidos');
        }
        const localDemoUser = await this.upsertLocalDemoUser(demoId, demoUser);
        const token = (0, auth_1.generateToken)({
            id: demoId,
            email: demoUser.email,
            nome: demoUser.nome,
            perfil: demoUser.perfil,
        });
        return {
            accessToken: token,
            usuario: this.localToResponse(localDemoUser),
        };
    }
    async findById(id) {
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findById(id), async () => this.findByIdLocal(id));
    }
    async findAll(page = 1, pageSize = 10) {
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findAll(page, pageSize), async () => this.findAllLocal(page, pageSize));
    }
    async update(id, data) {
        if (data.email !== undefined) {
            throw new Error('Alteração de email não é permitida');
        }
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.update(id, data), async () => this.updateLocal(id, data));
    }
    async updateOwnProfile(id, _perfilAtual, data) {
        const usuarioAtual = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findById(id), async () => this.findByIdLocal(id));
        if (!usuarioAtual) {
            throw new Error('Usuário não encontrado');
        }
        const updateData = {};
        if (typeof data.nome === 'string' && data.nome.trim()) {
            updateData.nome = data.nome.trim();
        }
        if (typeof data.email === 'string' && data.email.trim() && data.email.trim().toLowerCase() !== String(usuarioAtual.email).toLowerCase()) {
            throw new Error('Alteração de email não é permitida');
        }
        if (!updateData.nome) {
            throw new Error('Nenhuma alteração informada');
        }
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.update(id, updateData), async () => this.updateLocal(id, updateData));
    }
    async updateOwnPassword(id, novaSenha) {
        if (!novaSenha || novaSenha.length < 6) {
            throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }
        const usuario = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findById(id), async () => this.findByIdLocal(id));
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }
        await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.updatePasswordById(id, novaSenha), async () => this.updatePasswordByIdLocal(id, novaSenha));
    }
    async updatePasswordById(id, novaSenha) {
        if (!novaSenha || novaSenha.length < 6) {
            throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }
        const usuario = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findById(id), async () => this.findByIdLocal(id));
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }
        await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.updatePasswordById(id, novaSenha), async () => this.updatePasswordByIdLocal(id, novaSenha));
    }
    async delete(id) {
        return (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.delete(id), async () => this.deleteLocal(id));
    }
    async forgotPassword(data) {
        if (!(0, validators_1.isValidEmail)(data.email)) {
            throw new Error('Email inválido');
        }
        const usuario = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findByEmail(data.email), async () => this.findByEmailLocal(data.email));
        if (!usuario) {
            return;
        }
        const codigo = `${Math.floor(100000 + Math.random() * 900000)}`;
        const expiraEm = new Date(Date.now() + 15 * 60 * 1000);
        await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.updateResetCode(data.email, codigo, expiraEm), async () => this.updateResetCodeLocal(data.email, codigo, expiraEm));
        await this.emailService.enviarCodigoRedefinicao(usuario.email, usuario.nome, codigo);
    }
    async resetPassword(data) {
        if (!(0, validators_1.isValidEmail)(data.email)) {
            throw new Error('Email inválido');
        }
        if (!data.codigo || data.codigo.length < 6) {
            throw new Error('Código inválido');
        }
        if (!data.novaSenha || data.novaSenha.length < 6) {
            throw new Error('A nova senha deve ter pelo menos 6 caracteres');
        }
        const usuario = await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.findByEmail(data.email), async () => this.findByEmailLocal(data.email));
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }
        if (!usuario.codigoResetSenha || !usuario.expiraResetSenha) {
            throw new Error('Solicite um novo código de redefinição');
        }
        if (usuario.codigoResetSenha !== data.codigo) {
            throw new Error('Código inválido');
        }
        if (new Date(usuario.expiraResetSenha).getTime() < Date.now()) {
            throw new Error('Código expirado. Solicite um novo código');
        }
        await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(async () => this.usuarioRepository.updatePasswordByEmail(data.email, data.novaSenha), async () => this.updatePasswordByEmailLocal(data.email, data.novaSenha));
    }
    async readLocalUsers() {
        try {
            const raw = await promises_1.default.readFile(this.fallbackFilePath, 'utf8');
            return JSON.parse(raw);
        }
        catch {
            await promises_1.default.mkdir(path_1.default.dirname(this.fallbackFilePath), { recursive: true });
            await promises_1.default.writeFile(this.fallbackFilePath, '[]', 'utf8');
            return [];
        }
    }
    async writeLocalUsers(users) {
        await promises_1.default.mkdir(path_1.default.dirname(this.fallbackFilePath), { recursive: true });
        await promises_1.default.writeFile(this.fallbackFilePath, JSON.stringify(users, null, 2), 'utf8');
    }
    localToResponse(user) {
        const { senha, ...rest } = user;
        return rest;
    }
    async findByEmailLocal(email) {
        const users = await this.readLocalUsers();
        return users.find((u) => String(u.email).toLowerCase() === email.toLowerCase()) || null;
    }
    async findByIdLocal(id) {
        const users = await this.readLocalUsers();
        const user = users.find((u) => Number(u.id) === id) || null;
        return user ? this.localToResponse(user) : null;
    }
    async findByIdLocalRaw(id) {
        const users = await this.readLocalUsers();
        return users.find((u) => Number(u.id) === id) || null;
    }
    async findAllLocal(page, pageSize) {
        const users = await this.readLocalUsers();
        const sorted = [...users].sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
        const skip = (page - 1) * pageSize;
        const itens = sorted.slice(skip, skip + pageSize).map((u) => this.localToResponse(u));
        return {
            usuarios: itens,
            total: users.length,
        };
    }
    async createLocal(data) {
        const users = await this.readLocalUsers();
        const nextId = users.length > 0 ? Math.max(...users.map((u) => Number(u.id) || 0)) + 1 : 1;
        const now = new Date().toISOString();
        const user = {
            id: nextId,
            nome: data.nome,
            email: data.email.toLowerCase(),
            dataNascimento: data.dataNascimento || null,
            senha: await (0, auth_2.hashPassword)(data.senha),
            perfil: data.perfil ?? 'ANALYST',
            status: data.status ?? true,
            dataCriacao: now,
            dataAtualizacao: now,
            codigoResetSenha: null,
            expiraResetSenha: null,
        };
        users.push(user);
        await this.writeLocalUsers(users);
        return this.localToResponse(user);
    }
    async updateLocal(id, data) {
        const users = await this.readLocalUsers();
        const idx = users.findIndex((u) => Number(u.id) === id);
        if (idx < 0) {
            throw new Error('Usuário não encontrado');
        }
        users[idx] = {
            ...users[idx],
            ...data,
            email: data.email ? String(data.email).toLowerCase() : users[idx].email,
            dataAtualizacao: new Date().toISOString(),
        };
        await this.writeLocalUsers(users);
        return this.localToResponse(users[idx]);
    }
    async updatePasswordByIdLocal(id, novaSenha) {
        const users = await this.readLocalUsers();
        const idx = users.findIndex((u) => Number(u.id) === id);
        if (idx < 0) {
            throw new Error('Usuário não encontrado');
        }
        users[idx].senha = await (0, auth_2.hashPassword)(novaSenha);
        users[idx].dataAtualizacao = new Date().toISOString();
        users[idx].codigoResetSenha = null;
        users[idx].expiraResetSenha = null;
        await this.writeLocalUsers(users);
    }
    async updateResetCodeLocal(email, codigo, expiraEm) {
        const users = await this.readLocalUsers();
        const idx = users.findIndex((u) => String(u.email).toLowerCase() === String(email).toLowerCase());
        if (idx < 0) {
            throw new Error('Usuário não encontrado');
        }
        users[idx].codigoResetSenha = codigo;
        users[idx].expiraResetSenha = expiraEm.toISOString();
        users[idx].dataAtualizacao = new Date().toISOString();
        await this.writeLocalUsers(users);
    }
    async updatePasswordByEmailLocal(email, novaSenha) {
        const users = await this.readLocalUsers();
        const idx = users.findIndex((u) => String(u.email).toLowerCase() === String(email).toLowerCase());
        if (idx < 0) {
            throw new Error('Usuário não encontrado');
        }
        users[idx].senha = await (0, auth_2.hashPassword)(novaSenha);
        users[idx].codigoResetSenha = null;
        users[idx].expiraResetSenha = null;
        users[idx].dataAtualizacao = new Date().toISOString();
        await this.writeLocalUsers(users);
    }
    async deleteLocal(id) {
        const users = await this.readLocalUsers();
        const filtered = users.filter((u) => Number(u.id) !== id);
        await this.writeLocalUsers(filtered);
    }
    async upsertLocalDemoUser(id, demoUser) {
        const users = await this.readLocalUsers();
        const idx = users.findIndex((u) => Number(u.id) === id || String(u.email).toLowerCase() === demoUser.email);
        const now = new Date().toISOString();
        const senhaHash = await (0, auth_2.hashPassword)(demoUser.senha);
        const next = {
            id,
            nome: demoUser.nome,
            email: demoUser.email,
            dataNascimento: null,
            senha: senhaHash,
            perfil: demoUser.perfil,
            status: true,
            dataCriacao: idx >= 0 ? users[idx].dataCriacao : now,
            dataAtualizacao: now,
            codigoResetSenha: null,
            expiraResetSenha: null,
        };
        if (idx >= 0) {
            users[idx] = next;
        }
        else {
            users.push(next);
        }
        await this.writeLocalUsers(users);
        return next;
    }
}
exports.UsuarioService = UsuarioService;
//# sourceMappingURL=UsuarioService.js.map