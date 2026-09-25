import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import {
  CreateClassificacaoDTO,
  UpdateClassificacaoDTO,
  ClassificacaoResponseDTO,
} from '../dtos/ClassificacaoDTO';

export class ClassificacaoRepository {
  async create(data: CreateClassificacaoDTO): Promise<ClassificacaoResponseDTO> {
    const codigoGerado = data.codigo || `CLS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const classificacao = await prisma.classificacao.create({
      data: {
        codigo: codigoGerado,
        nome: data.nome,
        categoria: data.categoria,
        status: data.status ?? true,
      },
    });

    return classificacao as ClassificacaoResponseDTO;
  }

  async findById(id: number): Promise<ClassificacaoResponseDTO | null> {
    const classificacao = await prisma.classificacao.findUnique({
      where: { id },
    });

    return classificacao as ClassificacaoResponseDTO | null;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: 'all' | 'active' | 'inactive' = 'all',
    sortBy: 'id' | 'nome' | 'codigo' | 'dataCriacao' = 'dataCriacao',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ classificacoes: ClassificacaoResponseDTO[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const searchTerm = search.trim();

    const where: Prisma.ClassificacaoWhereInput = {
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
    } as const;

    const orderBy = { [sortFieldMap[sortBy]]: sortOrder } as Prisma.ClassificacaoOrderByWithRelationInput;

    const [classificacoes, total] = await Promise.all([
      prisma.classificacao.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.classificacao.count({ where }),
    ]);

    return {
      classificacoes: classificacoes as ClassificacaoResponseDTO[],
      total,
    };
  }

  async update(id: number, data: UpdateClassificacaoDTO): Promise<ClassificacaoResponseDTO> {
    const classificacao = await prisma.classificacao.update({
      where: { id },
      data,
    });

    return classificacao as ClassificacaoResponseDTO;
  }

  async delete(id: number): Promise<void> {
    await prisma.classificacao.delete({
      where: { id },
    });
  }
}
