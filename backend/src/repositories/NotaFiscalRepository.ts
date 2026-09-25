import prisma from '../config/database';
import {
  CreateNotaFiscalDTO,
  UpdateNotaFiscalDTO,
  NotaFiscalResponseDTO,
  ListarNotasFiscaisFiltersDTO,
} from '../dtos/NotaFiscalDTO';
import {
  emptyCamposObrigatorios,
  encodeNotaFiscalMetadata,
  hasPendenciaClassificacao,
  parseNotaFiscalMetadata,
} from '../utils/notaFiscalMetadata';
import { runWithPrismaFallback } from '../utils/prismaCircuitBreaker';
import fs from 'fs/promises';
import path from 'path';
import { Decimal } from '@prisma/client/runtime/library';

export class NotaFiscalRepository {
  private fallbackFilePath = path.resolve(process.cwd(), 'data', 'notas-fiscais-fallback.json');

  private normalize(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .trim()
      .toLowerCase();
  }

  private parseDateBoundary(raw?: string, endOfDay: boolean = false): Date | null {
    if (!raw) {
      return null;
    }

    const normalized = String(raw).trim();
    if (!normalized) {
      return null;
    }

    const date = new Date(`${normalized}${endOfDay ? 'T23:59:59.999' : 'T00:00:00.000'}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private stringFilterMatch(value: unknown, filters?: string[]): boolean {
    if (!filters?.length) {
      return true;
    }

    const normalizedValue = this.normalize(value);
    if (!normalizedValue) {
      return false;
    }

    return filters.some((filter) => this.normalize(filter) === normalizedValue);
  }

  private numberFilterMatch(value: number, filters?: number[]): boolean {
    if (!filters?.length) {
      return true;
    }

    return filters.includes(Number(value));
  }

  private applyAdvancedFilters(
    items: NotaFiscalResponseDTO[],
    filters?: ListarNotasFiscaisFiltersDTO,
    dataInicio?: Date | null,
    dataFim?: Date | null,
  ): NotaFiscalResponseDTO[] {
    if (!filters) {
      return items;
    }

    return items.filter((item) => {
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      if (!this.numberFilterMatch(item.obraId, filters.obraId)) {
        return false;
      }

      const campos = item.camposClassificacao || {};

      if (!this.stringFilterMatch(campos.programa, filters.programa)) {
        return false;
      }

      if (!this.stringFilterMatch(campos.classificacaoProjetoAtt, filters.classificacao)) {
        return false;
      }

      if (!this.stringFilterMatch(campos.orcadoNaoOrcado, filters.orcadoNaoOrcado)) {
        return false;
      }

      if (!this.stringFilterMatch(campos.projeto, filters.projeto)) {
        return false;
      }

      if (dataInicio || dataFim) {
        const dataEmissao = new Date(item.dataEmissao as any);
        if (Number.isNaN(dataEmissao.getTime())) {
          return false;
        }

        if (dataInicio && dataEmissao < dataInicio) {
          return false;
        }

        if (dataFim && dataEmissao > dataFim) {
          return false;
        }
      }

      return true;
    });
  }

  async create(data: CreateNotaFiscalDTO): Promise<NotaFiscalResponseDTO> {
    const metadata = {
      camposObrigatorios: {
        ...emptyCamposObrigatorios(),
        ...(data.camposClassificacao
          ? {
              orcadoNaoOrcado: data.camposClassificacao.orcadoNaoOrcado ?? null,
              programa: data.camposClassificacao.programa ?? null,
              instituicao: data.camposClassificacao.instituicao ?? null,
              projeto: data.camposClassificacao.projeto ?? null,
              classificacaoProjetoAtt: data.camposClassificacao.classificacaoProjetoAtt ?? null,
            }
          : {}),
      },
      camposOpcionais: {
        indiceImportacao: data.camposClassificacao?.indiceImportacao ?? null,
        historico: data.camposClassificacao?.historico ?? null,
        unidadeNegocio: data.camposClassificacao?.unidadeNegocio ?? null,
        dataPagamento: data.camposClassificacao?.dataPagamento ?? null,
        razaoSocial: data.camposClassificacao?.razaoSocial ?? null,
        valor: data.camposClassificacao?.valor ?? null,
        codDocumento: data.camposClassificacao?.codDocumento ?? null,
        observacoes: data.camposClassificacao?.observacoes ?? null,
        publicoAlvo: data.camposClassificacao?.publicoAlvo ?? null,
        classe: data.camposClassificacao?.classe ?? null,
        classificacaoConta: data.camposClassificacao?.classificacaoConta ?? null,
      },
      textoObservacao: data.observacao || null,
    };

    return runWithPrismaFallback(
      async () => {
        const notaFiscal = await prisma.notaFiscal.create({
          data: {
            numeroNF: data.numeroNF,
            fornecedor: data.fornecedor,
            cnpj: data.cnpj,
            valor: new Decimal(data.valor),
            dataEmissao: new Date(data.dataEmissao),
            obraId: data.obraId,
            actionCode: data.actionCode,
            orcadoNaoOrcadoId: data.orcadoNaoOrcadoId ?? null,
            programaId: data.programaId ?? null,
            instituicaoId: data.instituicaoId ?? null,
            projetoId: data.projetoId ?? null,
            classificacaoAttId: data.classificacaoAttId ?? null,
            publicoAlvoId: data.publicoAlvoId ?? null,
            status: data.status || 'PENDENTE',
            origemImportacao: data.origemImportacao,
            observacao: encodeNotaFiscalMetadata(metadata),
          },
          include: this.defaultIncludes(),
        });

        return this.mapResponse(notaFiscal);
      },
      async () => this.createFallback(data, metadata),
    );
  }

  private defaultIncludes() {
    return {
      obra: {
        select: {
          local: true,
          nomeObra: true,
          un: true,
        },
      },
      orcadoNaoOrcado: {
        select: { id: true, nome: true, codigo: true },
      },
      programa: {
        select: { id: true, nome: true },
      },
      instituicao: {
        select: { id: true, instituicao: true },
      },
      projeto: {
        select: { id: true, nome: true, publicoAlvo: true },
      },
      classificacaoAtt: {
        select: { id: true, nome: true },
      },
      publicoAlvo: {
        select: { id: true, nome: true },
      },
    };
  }

  async findById(id: number): Promise<NotaFiscalResponseDTO | null> {
    return runWithPrismaFallback(
      async () => {
        const notaFiscal = await prisma.notaFiscal.findUnique({
          where: { id },
          include: this.defaultIncludes(),
        });

        return notaFiscal ? this.mapResponse(notaFiscal) : null;
      },
      async () => {
        const itens = await this.readFallback();
        return itens.find((item) => item.id === id) || null;
      },
    );
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    filters?: ListarNotasFiscaisFiltersDTO,
  ): Promise<{ notasFiscais: NotaFiscalResponseDTO[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const dataInicio = this.parseDateBoundary(filters?.dataInicio, false);
    const dataFim = this.parseDateBoundary(filters?.dataFim, true);

    const where = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.obraId?.length && { obraId: { in: filters.obraId } }),
      ...((dataInicio || dataFim) && {
        dataEmissao: {
          ...(dataInicio ? { gte: dataInicio } : {}),
          ...(dataFim ? { lte: dataFim } : {}),
        },
      }),
    };

    return runWithPrismaFallback(
      async () => {
        const notasFiscais = await prisma.notaFiscal.findMany({
          where,
          orderBy: { dataCriacao: 'desc' },
          include: this.defaultIncludes(),
        });

        const filtrados = this.applyAdvancedFilters(
          notasFiscais.map((nf) => this.mapResponse(nf)),
          filters,
          dataInicio,
          dataFim,
        );

        return {
          notasFiscais: filtrados.slice(skip, skip + pageSize),
          total: filtrados.length,
        };
      },
      async () => {
        const itens = await this.readFallback();
        const toTimestamp = (value: unknown) => {
          const date = new Date(value as any);
          return Number.isNaN(date.getTime()) ? 0 : date.getTime();
        };

        const ordenados = [...itens].sort((a, b) => toTimestamp(b.dataCriacao) - toTimestamp(a.dataCriacao));
        const filtrados = this.applyAdvancedFilters(ordenados, filters, dataInicio, dataFim);

        return {
          notasFiscais: filtrados.slice(skip, skip + pageSize),
          total: filtrados.length,
        };
      },
    );
  }

  async update(id: number, data: UpdateNotaFiscalDTO): Promise<NotaFiscalResponseDTO> {
    const atual: any = await runWithPrismaFallback<any | null>(
      async () => prisma.notaFiscal.findUnique({ where: { id } }),
      async () => {
        const itens = await this.readFallback();
        return itens.find((item) => item.id === id) || null;
      },
    );

    if (!atual) {
      throw new Error('Nota Fiscal não encontrada');
    }

    const updateData: any = { ...data };
    if (data.valor !== undefined) {
      updateData.valor = new Decimal(data.valor);
    }
    if (data.dataEmissao !== undefined) {
      updateData.dataEmissao = new Date(data.dataEmissao);
    }

    const metadataAtual = parseNotaFiscalMetadata(atual.observacao);

    if (data.camposClassificacao) {
      const mergedMetadata = {
        camposObrigatorios: {
          ...metadataAtual.camposObrigatorios,
          ...(data.camposClassificacao.orcadoNaoOrcado !== undefined
            ? { orcadoNaoOrcado: data.camposClassificacao.orcadoNaoOrcado }
            : {}),
          ...(data.camposClassificacao.programa !== undefined
            ? { programa: data.camposClassificacao.programa }
            : {}),
          ...(data.camposClassificacao.instituicao !== undefined
            ? { instituicao: data.camposClassificacao.instituicao }
            : {}),
          ...(data.camposClassificacao.projeto !== undefined
            ? { projeto: data.camposClassificacao.projeto }
            : {}),
          ...(data.camposClassificacao.classificacaoProjetoAtt !== undefined
            ? { classificacaoProjetoAtt: data.camposClassificacao.classificacaoProjetoAtt }
            : {}),
        },
        camposOpcionais: {
          ...metadataAtual.camposOpcionais,
          ...(data.camposClassificacao.indiceImportacao !== undefined
            ? { indiceImportacao: data.camposClassificacao.indiceImportacao }
            : {}),
          ...(data.camposClassificacao.historico !== undefined
            ? { historico: data.camposClassificacao.historico }
            : {}),
          ...(data.camposClassificacao.unidadeNegocio !== undefined
            ? { unidadeNegocio: data.camposClassificacao.unidadeNegocio }
            : {}),
          ...(data.camposClassificacao.dataPagamento !== undefined
            ? { dataPagamento: data.camposClassificacao.dataPagamento }
            : {}),
          ...(data.camposClassificacao.razaoSocial !== undefined
            ? { razaoSocial: data.camposClassificacao.razaoSocial }
            : {}),
          ...(data.camposClassificacao.valor !== undefined
            ? { valor: data.camposClassificacao.valor }
            : {}),
          ...(data.camposClassificacao.codDocumento !== undefined
            ? { codDocumento: data.camposClassificacao.codDocumento }
            : {}),
          ...(data.camposClassificacao.observacoes !== undefined
            ? { observacoes: data.camposClassificacao.observacoes }
            : {}),
          ...(data.camposClassificacao.publicoAlvo !== undefined
            ? { publicoAlvo: data.camposClassificacao.publicoAlvo }
            : {}),
          ...(data.camposClassificacao.classe !== undefined
            ? { classe: data.camposClassificacao.classe }
            : {}),
          ...(data.camposClassificacao.classificacaoConta !== undefined
            ? { classificacaoConta: data.camposClassificacao.classificacaoConta }
            : {}),
        },
        textoObservacao: data.observacao !== undefined ? data.observacao : metadataAtual.textoObservacao,
      };

      updateData.observacao = encodeNotaFiscalMetadata(mergedMetadata);
      updateData.status = hasPendenciaClassificacao(mergedMetadata) ? 'PENDENTE' : 'CLASSIFICADA';
    } else if (data.observacao !== undefined) {
      updateData.observacao = encodeNotaFiscalMetadata({
        ...metadataAtual,
        textoObservacao: data.observacao,
      });
    }

    delete updateData.camposClassificacao;

    return runWithPrismaFallback(
      async () => {
        const notaFiscal = await prisma.notaFiscal.update({
          where: { id },
          data: updateData,
          include: this.defaultIncludes(),
        });

        return this.mapResponse(notaFiscal);
      },
      async () => this.updateFallback(id, updateData),
    );
  }

  async delete(id: number): Promise<void> {
    await runWithPrismaFallback(
      async () => {
        await prisma.notaFiscal.delete({
          where: { id },
        });
      },
      async () => {
        const itens = await this.readFallback();
        await this.writeFallback(itens.filter((item) => item.id !== id));
      },
    );
  }

  async deleteMany(ids: number[]): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    return runWithPrismaFallback(
      async () => {
        const result = await prisma.notaFiscal.deleteMany({
          where: { id: { in: ids } },
        });

        return result.count;
      },
      async () => {
        const itens = await this.readFallback();
        const idsSet = new Set(ids);
        const filtrados = itens.filter((item) => !idsSet.has(item.id));
        const removidos = itens.length - filtrados.length;
        await this.writeFallback(filtrados);
        return removidos;
      },
    );
  }

  async deleteAll(): Promise<number> {
    return runWithPrismaFallback(
      async () => {
        const result = await prisma.notaFiscal.deleteMany();
        return result.count;
      },
      async () => {
        const itens = await this.readFallback();
        await this.writeFallback([]);
        return itens.length;
      },
    );
  }

  async findByNumero(numero: string): Promise<NotaFiscalResponseDTO | null> {
    return runWithPrismaFallback(
      async () => {
        const notaFiscal = await prisma.notaFiscal.findFirst({
          where: { numeroNF: numero },
        });

        return notaFiscal ? this.mapResponse(notaFiscal) : null;
      },
      async () => {
        const itens = await this.readFallback();
        return itens.find((item) => item.numeroNF === numero) || null;
      },
    );
  }

  async getAllForPendenciaMetric() {
    return runWithPrismaFallback(
      async () =>
        prisma.notaFiscal.findMany({
          select: {
            id: true,
            observacao: true,
          },
        }),
      async () => {
        const itens = await this.readFallback();
        return itens.map((item) => ({ id: item.id, observacao: item.observacao || null }));
      },
    );
  }

  private mapResponse(notaFiscal: any): NotaFiscalResponseDTO {
    const metadata = parseNotaFiscalMetadata(notaFiscal.observacao);
    const dataEmissao = new Date(notaFiscal.dataEmissao as any);
    const periodo = Number.isNaN(dataEmissao.getTime())
      ? ''
      : `${String(dataEmissao.getMonth() + 1).padStart(2, '0')}/${dataEmissao.getFullYear()}`;

    // Resolve nomes a partir das tabelas relacionadas (FK), com fallback para JSON observacao
    const orcadoNaoOrcado = notaFiscal.orcadoNaoOrcado?.nome
      ?? metadata.camposObrigatorios.orcadoNaoOrcado
      ?? null;
    const programa = notaFiscal.programa?.nome
      ?? metadata.camposObrigatorios.programa
      ?? null;
    const instituicao = notaFiscal.instituicao?.instituicao
      ?? metadata.camposObrigatorios.instituicao
      ?? null;
    const projeto = notaFiscal.projeto?.nome
      ?? metadata.camposObrigatorios.projeto
      ?? null;
    const classificacaoProjetoAtt = notaFiscal.classificacaoAtt?.nome
      ?? metadata.camposObrigatorios.classificacaoProjetoAtt
      ?? null;
    const unidadeNegocio = notaFiscal.obra?.un
      ?? metadata.camposOpcionais.unidadeNegocio
      ?? null;
    const publicoAlvo = notaFiscal.publicoAlvo?.nome
      ?? notaFiscal.projeto?.publicoAlvo
      ?? metadata.camposOpcionais.publicoAlvo
      ?? null;

    return {
      ...notaFiscal,
      valor: Number(notaFiscal.valor),
      actionCode: notaFiscal.actionCode ?? null,
      orcadoNaoOrcadoId: notaFiscal.orcadoNaoOrcadoId ?? null,
      programaId: notaFiscal.programaId ?? null,
      instituicaoId: notaFiscal.instituicaoId ?? null,
      projetoId: notaFiscal.projetoId ?? null,
      classificacaoAttId: notaFiscal.classificacaoAttId ?? null,
      publicoAlvoId: notaFiscal.publicoAlvoId ?? null,
      periodo,
      localizacao: notaFiscal.obra?.local || notaFiscal.obra?.nomeObra || null,
      unidadeNegocio,
      observacao: metadata.textoObservacao || metadata.camposOpcionais.observacoes || null,
      camposClassificacao: {
        orcadoNaoOrcado,
        programa,
        instituicao,
        projeto,
        classificacaoProjetoAtt,
        unidadeNegocio,
        publicoAlvo,
        ...metadata.camposOpcionais,
        ...(notaFiscal.classificacaoConta?.nome
          ? { classificacaoConta: notaFiscal.classificacaoConta.nome }
          : {}),
      },
      pendenteClassificacao: hasPendenciaClassificacao({
        ...metadata,
        camposObrigatorios: {
          orcadoNaoOrcado,
          programa,
          instituicao,
          projeto,
          classificacaoProjetoAtt,
        },
      }),
    };
  }

  private async readFallback(): Promise<NotaFiscalResponseDTO[]> {
    try {
      const raw = await fs.readFile(this.fallbackFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as NotaFiscalResponseDTO[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async writeFallback(data: NotaFiscalResponseDTO[]): Promise<void> {
    await fs.mkdir(path.dirname(this.fallbackFilePath), { recursive: true });
    await fs.writeFile(this.fallbackFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private async createFallback(data: CreateNotaFiscalDTO, metadata: any): Promise<NotaFiscalResponseDTO> {
    const itens = await this.readFallback();
    const id = itens.length ? Math.max(...itens.map((item) => item.id)) + 1 : 1;

    const registro: NotaFiscalResponseDTO = {
      id,
      numeroNF: data.numeroNF,
      fornecedor: data.fornecedor,
      cnpj: data.cnpj,
      valor: data.valor,
      dataEmissao: new Date(data.dataEmissao),
      obraId: data.obraId,
      actionCode: data.actionCode ?? null,
      periodo: (() => {
        const dataEmissao = new Date(data.dataEmissao as any);
        return Number.isNaN(dataEmissao.getTime())
          ? ''
          : `${String(dataEmissao.getMonth() + 1).padStart(2, '0')}/${dataEmissao.getFullYear()}`;
      })(),
      localizacao: null,
      status: (data.status || 'PENDENTE') as string,
      origemImportacao: data.origemImportacao,
      observacao: metadata.textoObservacao || null,
      camposClassificacao: {
        ...metadata.camposObrigatorios,
        ...metadata.camposOpcionais,
      },
      pendenteClassificacao: hasPendenciaClassificacao(metadata),
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    };

    itens.unshift(registro);
    await this.writeFallback(itens);
    return registro;
  }

  private async updateFallback(id: number, updateData: any): Promise<NotaFiscalResponseDTO> {
    const itens = await this.readFallback();
    const index = itens.findIndex((item) => item.id === id);

    if (index < 0) {
      throw new Error('Nota Fiscal não encontrada');
    }

    const atual = itens[index];
    const metadata = updateData.observacao
      ? parseNotaFiscalMetadata(updateData.observacao)
      : {
          camposObrigatorios: {
            orcadoNaoOrcado: atual.camposClassificacao?.orcadoNaoOrcado || null,
            programa: atual.camposClassificacao?.programa || null,
            instituicao: atual.camposClassificacao?.instituicao || null,
            projeto: atual.camposClassificacao?.projeto || null,
            classificacaoProjetoAtt: atual.camposClassificacao?.classificacaoProjetoAtt || null,
          },
          camposOpcionais: {
            historico: atual.camposClassificacao?.historico || null,
            unidadeNegocio: atual.camposClassificacao?.unidadeNegocio || null,
            dataPagamento: atual.camposClassificacao?.dataPagamento || null,
            razaoSocial: atual.camposClassificacao?.razaoSocial || null,
            valor: atual.camposClassificacao?.valor || null,
            codDocumento: atual.camposClassificacao?.codDocumento || null,
            observacoes: atual.camposClassificacao?.observacoes || null,
            publicoAlvo: atual.camposClassificacao?.publicoAlvo || null,
            classe: atual.camposClassificacao?.classe || null,
            classificacaoConta: atual.camposClassificacao?.classificacaoConta || null,
          },
          textoObservacao: atual.observacao || null,
        };

    const atualizado: NotaFiscalResponseDTO = {
      ...atual,
      ...updateData,
      valor: updateData.valor !== undefined ? Number(updateData.valor) : atual.valor,
      dataEmissao: updateData.dataEmissao ? new Date(updateData.dataEmissao) : atual.dataEmissao,
      actionCode: updateData.actionCode !== undefined ? updateData.actionCode : (atual as any).actionCode ?? null,
      periodo: (() => {
        const dataEmissao = new Date((updateData.dataEmissao ? new Date(updateData.dataEmissao) : atual.dataEmissao) as any);
        return Number.isNaN(dataEmissao.getTime())
          ? ''
          : `${String(dataEmissao.getMonth() + 1).padStart(2, '0')}/${dataEmissao.getFullYear()}`;
      })(),
      localizacao: (atual as any).localizacao ?? null,
      observacao: metadata.textoObservacao || metadata.camposOpcionais.observacoes || null,
      camposClassificacao: {
        ...metadata.camposObrigatorios,
        ...metadata.camposOpcionais,
      },
      pendenteClassificacao: hasPendenciaClassificacao(metadata),
      dataAtualizacao: new Date(),
    };

    itens[index] = atualizado;
    await this.writeFallback(itens);
    return atualizado;
  }
}
