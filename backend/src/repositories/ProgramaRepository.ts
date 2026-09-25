import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { CreateProgramaDTO, UpdateProgramaDTO, ProgramaResponseDTO } from '../dtos/ProgramaDTO';

export class ProgramaRepository {
  async create(data: CreateProgramaDTO): Promise<ProgramaResponseDTO> {
    const codigoGerado = data.codigo || `PRG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const programa = await prisma.programa.create({
      data: {
        codigo: codigoGerado,
        nome: data.nome,
        descricao: data.descricao,
        status: data.status ?? true,
      },
    });

    return programa as ProgramaResponseDTO;
  }

  async findById(id: number): Promise<ProgramaResponseDTO | null> {
    const programa = await prisma.programa.findUnique({
      where: { id },
    });

    return programa as ProgramaResponseDTO | null;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: 'all' | 'active' | 'inactive' = 'all',
    sortBy: 'id' | 'nome' | 'codigo' | 'dataCriacao' = 'dataCriacao',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ programas: ProgramaResponseDTO[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const searchTerm = search.trim();

    const where: Prisma.ProgramaWhereInput = {
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
    } as const;

    const orderBy = { [sortFieldMap[sortBy]]: sortOrder } as Prisma.ProgramaOrderByWithRelationInput;

    const [programas, total] = await Promise.all([
      prisma.programa.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.programa.count({ where }),
    ]);

    return {
      programas: programas as ProgramaResponseDTO[],
      total,
    };
  }

  async update(id: number, data: UpdateProgramaDTO): Promise<ProgramaResponseDTO> {
    const programa = await prisma.programa.update({
      where: { id },
      data,
    });

    return programa as ProgramaResponseDTO;
  }

  async delete(id: number): Promise<void> {
    await prisma.programa.delete({
      where: { id },
    });
  }
}
