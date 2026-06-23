import { UsuarioRepository } from '../repositories/UsuarioRepository';
import {
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  LoginDTO,
  TokenDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from '../dtos/UsuarioDTO';
import { generateToken, verifyPassword } from '../utils/auth';
import { isValidEmail } from '../utils/validators';
import { runWithPrismaFallback } from '../utils/prismaCircuitBreaker';
import { EmailService } from './EmailService';
import { hashPassword } from '../utils/auth';
import logger from '../config/logger';
import fs from 'fs/promises';
import path from 'path';

const demoUsers: Record<string, { nome: string; email: string; senha: string; perfil: 'MASTER' | 'ADMIN' | 'ANALYST' | 'MANAGER' }> = {
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

export class UsuarioService {
  private usuarioRepository = new UsuarioRepository();
  private emailService = new EmailService();
  private fallbackFilePath = path.resolve(process.cwd(), 'data', 'usuarios-fallback.json');

  async create(data: CreateUsuarioDTO) {
    // Validar email
    if (!isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    // Verificar se email já existe
    const existe = await runWithPrismaFallback(
      async () => this.usuarioRepository.findByEmail(data.email),
      async () => this.findByEmailLocal(data.email),
    );
    if (existe) {
      throw new Error('Email já cadastrado');
    }

    if (!data.dataNascimento) {
      throw new Error('Data de nascimento é obrigatória');
    }

    const usuarioCriado = await runWithPrismaFallback(
      async () => this.usuarioRepository.create(data),
      async () => this.createLocal(data),
    );

    // Enviar email de boas-vindas (não bloqueia em caso de falha de SMTP)
    this.emailService
      .enviarBoasVindasUsuario(data.email, data.nome, data.senha)
      .catch((err) => logger.warn(`Falha ao enviar email de boas-vindas para ${data.email}: ${err?.message}`));

    return usuarioCriado;
  }

  async login(data: LoginDTO): Promise<TokenDTO> {
    const usuarioComSenha = await runWithPrismaFallback(
      async () => this.usuarioRepository.findByEmail(data.email),
      async () => this.findByEmailLocal(data.email),
    );

    if (usuarioComSenha) {
      const senhaValida = await verifyPassword(data.senha, (usuarioComSenha as any).senha);

      if (!senhaValida) {
        throw new Error('Email ou senha inválidos');
      }

      const token = generateToken({
        id: usuarioComSenha.id,
        email: usuarioComSenha.email,
        nome: usuarioComSenha.nome,
        perfil: usuarioComSenha.perfil,
      });

      const usuarioResponse = await runWithPrismaFallback(
        async () => this.usuarioRepository['formatResponse'](usuarioComSenha),
        async () => this.localToResponse(usuarioComSenha as any),
      );

      return {
        accessToken: token,
        usuario: usuarioResponse,
      };
    }

    const demoUser = demoUsers[data.email.toLowerCase()];

    if (!demoUser || demoUser.senha !== data.senha) {
      throw new Error('Email ou senha inválidos');
    }

    const demoUserIdMap: Record<string, number> = {
      'master@classificacao.com': 100,
      'admin@classificacao.com': 101,
      'analista@classificacao.com': 102,
      'gestor@classificacao.com': 103,
    };

    const demoId = demoUserIdMap[demoUser.email] ?? 999;
    const existingDemoLocalUser = await this.findByIdLocalRaw(demoId);

    if (
      existingDemoLocalUser &&
      String(existingDemoLocalUser.email).toLowerCase() !== demoUser.email.toLowerCase()
    ) {
      throw new Error('Email ou senha inválidos');
    }

    const localDemoUser = await this.upsertLocalDemoUser(demoId, demoUser);

    const token = generateToken({
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

  async findById(id: number) {
    return runWithPrismaFallback(
      async () => this.usuarioRepository.findById(id),
      async () => this.findByIdLocal(id),
    );
  }

  async findAll(page: number = 1, pageSize: number = 10) {
    return runWithPrismaFallback(
      async () => this.usuarioRepository.findAll(page, pageSize),
      async () => this.findAllLocal(page, pageSize),
    );
  }

  async update(id: number, data: UpdateUsuarioDTO) {
    if (data.email !== undefined) {
      throw new Error('Alteração de email não é permitida');
    }

    return runWithPrismaFallback(
      async () => this.usuarioRepository.update(id, data),
      async () => this.updateLocal(id, data),
    );
  }

  async updateOwnProfile(id: number, _perfilAtual: string, data: { nome?: string; email?: string }) {
    const usuarioAtual = await runWithPrismaFallback(
      async () => this.usuarioRepository.findById(id),
      async () => this.findByIdLocal(id),
    );
    if (!usuarioAtual) {
      throw new Error('Usuário não encontrado');
    }

    const updateData: UpdateUsuarioDTO = {};

    if (typeof data.nome === 'string' && data.nome.trim()) {
      updateData.nome = data.nome.trim();
    }

    if (typeof data.email === 'string' && data.email.trim() && data.email.trim().toLowerCase() !== String(usuarioAtual.email).toLowerCase()) {
      throw new Error('Alteração de email não é permitida');
    }

    if (!updateData.nome) {
      throw new Error('Nenhuma alteração informada');
    }

    return runWithPrismaFallback(
      async () => this.usuarioRepository.update(id, updateData),
      async () => this.updateLocal(id, updateData),
    );
  }

  async updateOwnPassword(id: number, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres');
    }

    const usuario = await runWithPrismaFallback(
      async () => this.usuarioRepository.findById(id),
      async () => this.findByIdLocal(id),
    );
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    await runWithPrismaFallback(
      async () => this.usuarioRepository.updatePasswordById(id, novaSenha),
      async () => this.updatePasswordByIdLocal(id, novaSenha),
    );
  }

  async updatePasswordById(id: number, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres');
    }

    const usuario = await runWithPrismaFallback(
      async () => this.usuarioRepository.findById(id),
      async () => this.findByIdLocal(id),
    );
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    await runWithPrismaFallback(
      async () => this.usuarioRepository.updatePasswordById(id, novaSenha),
      async () => this.updatePasswordByIdLocal(id, novaSenha),
    );
  }

  async delete(id: number) {
    return runWithPrismaFallback(
      async () => this.usuarioRepository.delete(id),
      async () => this.deleteLocal(id),
    );
  }

  async forgotPassword(data: ForgotPasswordDTO): Promise<void> {
    if (!isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    const usuario = await runWithPrismaFallback(
      async () => this.usuarioRepository.findByEmail(data.email),
      async () => this.findByEmailLocal(data.email),
    );

    if (!usuario) {
      return;
    }

    const codigo = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

    await runWithPrismaFallback(
      async () => this.usuarioRepository.updateResetCode(data.email, codigo, expiraEm),
      async () => this.updateResetCodeLocal(data.email, codigo, expiraEm),
    );

    await this.emailService.enviarCodigoRedefinicao(usuario.email, usuario.nome, codigo);
  }

  async resetPassword(data: ResetPasswordDTO): Promise<void> {
    if (!isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    const codigoLimpo = String(data.codigo || '').trim();
    if (!codigoLimpo || codigoLimpo.length < 6) {
      throw new Error('Código inválido');
    }

    if (!data.novaSenha || data.novaSenha.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres');
    }

    const usuario = await runWithPrismaFallback(
      async () => this.usuarioRepository.findByEmail(data.email),
      async () => this.findByEmailLocal(data.email),
    );

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    if (!usuario.codigoResetSenha || !usuario.expiraResetSenha) {
      throw new Error('Solicite um novo código de redefinição');
    }

    if (usuario.codigoResetSenha !== codigoLimpo) {
      throw new Error('Código inválido');
    }

    if (new Date(usuario.expiraResetSenha).getTime() < Date.now()) {
      throw new Error('Código expirado. Solicite um novo código');
    }

    await runWithPrismaFallback(
      async () => this.usuarioRepository.updatePasswordByEmail(data.email, data.novaSenha),
      async () => this.updatePasswordByEmailLocal(data.email, data.novaSenha),
    );
  }

  private async readLocalUsers(): Promise<any[]> {
    try {
      const raw = await fs.readFile(this.fallbackFilePath, 'utf8');
      return JSON.parse(raw) as any[];
    } catch {
      await fs.mkdir(path.dirname(this.fallbackFilePath), { recursive: true });
      await fs.writeFile(this.fallbackFilePath, '[]', 'utf8');
      return [];
    }
  }

  private async writeLocalUsers(users: any[]): Promise<void> {
    await fs.mkdir(path.dirname(this.fallbackFilePath), { recursive: true });
    await fs.writeFile(this.fallbackFilePath, JSON.stringify(users, null, 2), 'utf8');
  }

  private localToResponse(user: any) {
    const { senha, ...rest } = user;
    return rest;
  }

  private async findByEmailLocal(email: string): Promise<any | null> {
    const users = await this.readLocalUsers();
    return users.find((u) => String(u.email).toLowerCase() === email.toLowerCase()) || null;
  }

  private async findByIdLocal(id: number): Promise<any | null> {
    const users = await this.readLocalUsers();
    const user = users.find((u) => Number(u.id) === id) || null;
    return user ? this.localToResponse(user) : null;
  }

  private async findByIdLocalRaw(id: number): Promise<any | null> {
    const users = await this.readLocalUsers();
    return users.find((u) => Number(u.id) === id) || null;
  }

  private async findAllLocal(page: number, pageSize: number): Promise<{ usuarios: any[]; total: number }> {
    const users = await this.readLocalUsers();
    const sorted = [...users].sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
    const skip = (page - 1) * pageSize;
    const itens = sorted.slice(skip, skip + pageSize).map((u) => this.localToResponse(u));

    return {
      usuarios: itens,
      total: users.length,
    };
  }

  private async createLocal(data: CreateUsuarioDTO): Promise<any> {
    const users = await this.readLocalUsers();
    const nextId = users.length > 0 ? Math.max(...users.map((u) => Number(u.id) || 0)) + 1 : 1;
    const now = new Date().toISOString();

    const user = {
      id: nextId,
      nome: data.nome,
      email: data.email.toLowerCase(),
      dataNascimento: data.dataNascimento || null,
      senha: await hashPassword(data.senha),
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

  private async updateLocal(id: number, data: UpdateUsuarioDTO): Promise<any> {
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

  private async updatePasswordByIdLocal(id: number, novaSenha: string): Promise<void> {
    const users = await this.readLocalUsers();
    const idx = users.findIndex((u) => Number(u.id) === id);
    if (idx < 0) {
      throw new Error('Usuário não encontrado');
    }

    users[idx].senha = await hashPassword(novaSenha);
    users[idx].dataAtualizacao = new Date().toISOString();
    users[idx].codigoResetSenha = null;
    users[idx].expiraResetSenha = null;

    await this.writeLocalUsers(users);
  }

  private async updateResetCodeLocal(email: string, codigo: string, expiraEm: Date): Promise<void> {
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

  private async updatePasswordByEmailLocal(email: string, novaSenha: string): Promise<void> {
    const users = await this.readLocalUsers();
    const idx = users.findIndex((u) => String(u.email).toLowerCase() === String(email).toLowerCase());
    if (idx < 0) {
      throw new Error('Usuário não encontrado');
    }

    users[idx].senha = await hashPassword(novaSenha);
    users[idx].codigoResetSenha = null;
    users[idx].expiraResetSenha = null;
    users[idx].dataAtualizacao = new Date().toISOString();

    await this.writeLocalUsers(users);
  }

  private async deleteLocal(id: number): Promise<void> {
    const users = await this.readLocalUsers();
    const filtered = users.filter((u) => Number(u.id) !== id);
    await this.writeLocalUsers(filtered);
  }

  private async upsertLocalDemoUser(
    id: number,
    demoUser: { nome: string; email: string; senha: string; perfil: 'MASTER' | 'ADMIN' | 'ANALYST' | 'MANAGER' },
  ): Promise<any> {
    const users = await this.readLocalUsers();
    const idx = users.findIndex((u) => Number(u.id) === id || String(u.email).toLowerCase() === demoUser.email);
    const now = new Date().toISOString();

    const senhaHash = await hashPassword(demoUser.senha);

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
    } else {
      users.push(next);
    }

    await this.writeLocalUsers(users);
    return next;
  }
}
