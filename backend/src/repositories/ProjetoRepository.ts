import prisma from '../config/database';
import { CreateProjetoDTO, UpdateProjetoDTO, ProjetoResponseDTO } from '../dtos/ProjetoDTO';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

export class ProjetoRepository {
  /**
   * Calcula a soma de todas as Notas Fiscais classificadas para um projeto
   */
  private async calcularValorRealizado(projetoId: number): Promise<number> {
    const nfsSomadas = await prisma.classificacaoNF.findMany({
      where: {
        projetoId,
        notaFiscal: {
          status: 'CLASSIFICADA',
        },
      },
      select: {
        notaFiscal: {
          select: {
            valor: true,
          },
        },
      },
    });

    const total = nfsSomadas.reduce((acc, item) => {
      return acc + (item.notaFiscal ? Number(item.notaFiscal.valor) : 0);
    }, 0);

    return total;
  }

  private async mapResponse(projeto: any): Promise<ProjetoResponseDTO> {
    // Calcula o valor realizado a partir das NFs classificadas
    const valorRealizado = await this.calcularValorRealizado(projeto.id);

    return {
      ...projeto,
      dataInicio: projeto.dataInicio ?? null,
      dataFim: projeto.dataFim ?? null,
      impactoMensal: Array.isArray(projeto.impactoMensal) ? projeto.impactoMensal : [],
      participantesProjeto: Array.isArray(projeto.participantesProjeto) ? projeto.participantesProjeto : [],
      valorMonetarioPrevisto: Number(projeto.valorMonetarioPrevisto ?? 0),
      valorMonetarioRealizado: valorRealizado,
      quantidadePessoasCadastradas: Number(projeto.quantidadePessoasCadastradas ?? 0),
      publicoAlvo: projeto.publicoAlvo ?? null,
      instituicaoId: projeto.instituicaoId ?? null,
      instituicaoNome: projeto.instituicao?.instituicao ?? null,
    } as ProjetoResponseDTO;
  }

  async create(data: CreateProjetoDTO): Promise<ProjetoResponseDTO> {
    const codigoGerado = data.codigo?.trim() || `PRJ-${Date.now()}`;

    const projeto = await prisma.projeto.create({
      data: {
        codigo: codigoGerado,
        nome: data.nome,
        descricao: data.descricao,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        impactoMensal: (data.impactoMensal ?? []) as unknown as Prisma.InputJsonValue,
        participantesProjeto: (data.participantesProjeto ?? []) as unknown as Prisma.InputJsonValue,
        pessoasCadastradas: data.pessoasCadastradas || null,
        quantidadePessoasCadastradas: data.quantidadePessoasCadastradas ?? 0,
        valorMonetarioPrevisto: new Decimal(data.valorMonetarioPrevisto ?? 0),
        valorMonetarioRealizado: new Decimal(0), // Sempre começa em 0, será calculado
        publicoAlvo: data.publicoAlvo || null,
        instituicaoId: data.instituicaoId ?? null,
        imagem: data.imagem || null,
        status: data.status ?? true,
      },
      include: {
        instituicao: {
          select: {
            instituicao: true,
          },
        },
      },
    });

    return await this.mapResponse(projeto);
  }

  async findById(id: number): Promise<ProjetoResponseDTO | null> {
    const projeto = await prisma.projeto.findUnique({
      where: { id },
      include: {
        instituicao: {
          select: {
            instituicao: true,
          },
        },
      },
    });

    return projeto ? await this.mapResponse(projeto) : null;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    status: 'all' | 'active' | 'inactive' = 'all',
    sortBy: 'id' | 'nome' | 'codigo' | 'dataCriacao' = 'dataCriacao',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ projetos: ProjetoResponseDTO[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const searchTerm = search.trim();

    const where: Prisma.ProjetoWhereInput = {
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

    const orderBy = { [sortFieldMap[sortBy]]: sortOrder } as Prisma.ProjetoOrderByWithRelationInput;

    const [projetos, total] = await Promise.all([
      prisma.projeto.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          instituicao: {
            select: {
              instituicao: true,
            },
          },
        },
      }),
      prisma.projeto.count({ where }),
    ]);

    const projetosComValores = await Promise.all(
      projetos.map((projeto) => this.mapResponse(projeto))
    );

    return {
      projetos: projetosComValores,
      total,
    };
  }

  async update(id: number, data: UpdateProjetoDTO): Promise<ProjetoResponseDTO> {
    const updateData: any = { ...data };
    
    // Remove valorMonetarioRealizado do update pois é calculado automaticamente
    delete updateData.valorMonetarioRealizado;
    
    if (data.valorMonetarioPrevisto !== undefined) {
      updateData.valorMonetarioPrevisto = new Decimal(data.valorMonetarioPrevisto ?? 0);
    }

    if (data.dataInicio !== undefined) {
      updateData.dataInicio = data.dataInicio ? new Date(data.dataInicio) : null;
    }

    if (data.dataFim !== undefined) {
      updateData.dataFim = data.dataFim ? new Date(data.dataFim) : null;
    }

    if (data.impactoMensal !== undefined) {
      updateData.impactoMensal = data.impactoMensal as unknown as Prisma.InputJsonValue;
    }

    if (data.participantesProjeto !== undefined) {
      updateData.participantesProjeto = data.participantesProjeto as unknown as Prisma.InputJsonValue;
    }

    if (data.imagem !== undefined) {
      updateData.imagem = data.imagem || null;
    }

    if (data.publicoAlvo !== undefined) {
      updateData.publicoAlvo = data.publicoAlvo || null;
    }

    if (data.instituicaoId !== undefined) {
      updateData.instituicaoId = data.instituicaoId ?? null;
    }

    const projeto = await prisma.projeto.update({
      where: { id },
      data: updateData,
      include: {
        instituicao: {
          select: {
            instituicao: true,
          },
        },
      },
    });

    return await this.mapResponse(projeto);
  }

  async delete(id: number): Promise<void> {
    await prisma.projeto.delete({
      where: { id },
    });
  }
}
