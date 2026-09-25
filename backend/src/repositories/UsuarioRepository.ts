import prisma from '../config/database';
import { CreateUsuarioDTO, UpdateUsuarioDTO, UsuarioResponseDTO } from '../dtos/UsuarioDTO';
import { hashPassword } from '../utils/auth';

export class UsuarioRepository {
  async create(data: CreateUsuarioDTO): Promise<UsuarioResponseDTO> {
    const senhaHash = await hashPassword(data.senha);

    const usuario = await prisma.usuario.create({
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

  async findById(id: number): Promise<UsuarioResponseDTO | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    });

    return usuario ? this.formatResponse(usuario) : null;
  }

  async findByEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ usuarios: UsuarioResponseDTO[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        skip,
        take: pageSize,
        orderBy: { dataCriacao: 'desc' },
      }),
      prisma.usuario.count(),
    ]);

    return {
      usuarios: usuarios.map((u) => this.formatResponse(u)),
      total,
    };
  }

  async update(id: number, data: UpdateUsuarioDTO): Promise<UsuarioResponseDTO> {
    const updateData = {
      ...data,
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
    };

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    return this.formatResponse(usuario);
  }

  async updateResetCode(email: string, codigo: string, expiraEm: Date): Promise<void> {
    await prisma.usuario.update({
      where: { email },
      data: {
        codigoResetSenha: codigo,
        expiraResetSenha: expiraEm,
      },
    });
  }

  async updatePasswordByEmail(email: string, novaSenha: string): Promise<void> {
    const senhaHash = await hashPassword(novaSenha);

    await prisma.usuario.update({
      where: { email },
      data: {
        senha: senhaHash,
        codigoResetSenha: null,
        expiraResetSenha: null,
      },
    });
  }

  async updatePasswordById(id: number, novaSenha: string): Promise<void> {
    const senhaHash = await hashPassword(novaSenha);

    await prisma.usuario.update({
      where: { id },
      data: {
        senha: senhaHash,
        codigoResetSenha: null,
        expiraResetSenha: null,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.usuario.delete({
      where: { id },
    });
  }

  private formatResponse(usuario: any): UsuarioResponseDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha, ...rest } = usuario;
    return rest;
  }
}
