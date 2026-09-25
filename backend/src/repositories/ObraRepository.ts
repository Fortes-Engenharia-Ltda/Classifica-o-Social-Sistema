import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { CreateObraDTO, UpdateObraDTO, ObraResponseDTO } from '../dtos/ObraDTO';

export class ObraRepository {
  async create(data: CreateObraDTO): Promise<ObraResponseDTO> {
    const obra = await prisma.obra.create({
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

    return obra as ObraResponseDTO;
  }

  async findById(id: number): Promise<ObraResponseDTO | null> {
    const obra = await prisma.obra.findUnique({
      where: { id },
    });

    return obra as ObraResponseDTO | null;
  }

  async findByCodigo(codigo: string): Promise<ObraResponseDTO | null> {
    const obra = await prisma.obra.findUnique({
      where: { codigoObra: codigo },
    });

    return obra as ObraResponseDTO | null;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: 'all' | 'active' | 'inactive' = 'all',
    sortBy:
      | 'id'
      | 'codigoObra'
      | 'nomeObra'
      | 'status'
      | 'projeto'
      | 'idCentroCusto'
      | 'centroCusto'
      | 'idUN'
      | 'un'
      | 'local'
      | 'cliente'
      | 'gerente'
      | 'gestor'
      | 'dataCriacao' = 'dataCriacao',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ obras: ObraResponseDTO[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const searchTerm = search.trim();

    const where: Prisma.ObraWhereInput = {
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
    } as const;

    const orderBy = { [sortFieldMap[sortBy]]: sortOrder } as Prisma.ObraOrderByWithRelationInput;

    const [obras, total] = await Promise.all([
      prisma.obra.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.obra.count({ where }),
    ]);

    return {
      obras: obras as ObraResponseDTO[],
      total,
    };
  }

  async update(id: number, data: UpdateObraDTO): Promise<ObraResponseDTO> {
    const obra = await prisma.obra.update({
      where: { id },
      data,
    });

    return obra as ObraResponseDTO;
  }

  async upsertByCodigo(data: CreateObraDTO): Promise<ObraResponseDTO> {
    const obra = await prisma.obra.upsert({
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

    return obra as ObraResponseDTO;
  }

  async delete(id: number): Promise<void> {
    await prisma.obra.delete({
      where: { id },
    });
  }
}
